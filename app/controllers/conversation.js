import Conversation from '../models/conversation';
import Message from '../models/message';
import * as statusMessage from '../constants/statusMessage';
import * as constants from '../constants/global';
import * as Notification from '../utils/notification';
import {
  removeSpaces,
  generateChannelName,
  keyBulk
} from '../middlewares/helpers';
import config from '../../config/main';
import { client, clientGenKey, clientBulk } from '../index';
import logger from '../../config/winston';
import mongoose from 'mongoose';
require('mongoose-long')(mongoose);

var Long = mongoose.Types.Long;

let keyBulkWrite = keyBulk();

// Create new conversation
export function newConversation(data, io, socket, pub) {
  if (!data.recipient.sn) {
    return io.to(socket.decoded.sn).emit('create-conversation', {
      status: false,
      error: statusMessage.chooseRecipient
    });
  }
  if (!data.body) {
    return io.to(socket.decoded.sn).emit('create-conversation', {
      status: false,
      error: statusMessage.missingMessage
    });
  }
  if (removeSpaces(data.body).length < constants.minLengthMessage) {
    return io.to(socket.decoded.sn).emit('create-conversation', {
      status: false,
      error: statusMessage.missingMessage
    });
  }
  if (removeSpaces(data.body).length > constants.maxLengthMessage) {
    return io.to(socket.decoded.sn).emit('create-conversation', {
      status: false,
      error: statusMessage.messageTooLong
    });
  }

  let channelName = generateChannelName(socket.decoded.sn, data.recipient.sn);

  client.hexists(config.keyRedis.sn, data.recipient.sn, (err, existed) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('newConversation: Redis ' + err);
      return io
        .to(socket.decoded.sn)
        .emit('create-conversation', { status: false });
    }
    if (existed == 0) {
      return io.to(socket.decoded.sn).emit('create-conversation', {
        status: false,
        error: statusMessage.notFoundUser
      });
    }
    client.hget(config.keyRedis.sn, data.recipient.sn, (err, recipientId) => {
      /* istanbul ignore if */
      if (err) {
        logger.error('newConversation: Redis ' + err);
        return io
          .to(socket.decoded.sn)
          .emit('create-conversation', { status: false });
      }
      client.sismember(
        config.keyRedis.channelName,
        channelName,
        (err, isMem) => {
          /* istanbul ignore if */
          if (err) {
            logger.error('newConversation: Redis ' + err);
            return io
              .to(socket.decoded.sn)
              .emit('create-conversation', { status: false });
          }
          if (isMem == 1) {
            return io.to(socket.decoded.sn).emit('create-conversation', {
              status: false,
              error: statusMessage.conversationExisted
            });
          }
          client.sadd(config.keyRedis.channelName, channelName, err => {
            /* istanbul ignore if */
            if (err) {
              logger.error('newConversation: Redis ' + err);
              return io
                .to(socket.decoded.sn)
                .emit('create-conversation', { status: false });
            }
            helperNewConversation(
              data,
              io,
              socket,
              recipientId,
              channelName,
              pub
            );
          });
        }
      );
    });
  });
}

// Get list of conversations
export function getListConversations(data, io, socket) {
  if (!data) {
    return io.to(socket.decoded.sn).emit('list-conversations', {
      error: statusMessage.lackOfDataSentIn
    });
  }
  let now = new Date(Date.now());

  // Only return one message from each conversation to display as snippet
  console.log('list-conversations  data.time', data.time, socket.decoded._id);
  let listConversations;
  let listConversationsModify = [];
  listConversations = Conversation.find({ par: socket.decoded._id });
  // if (!data.time) {
  //   listConversations = Conversation.find({ par: socket.decoded._id });
  // } else {
  //   listConversations = Conversation.find({
  //     par: socket.decoded._id,
  //     updatedAt: { $gt: new Date(data.time), $lt: now }
  //   });
  // }
  listConversations
    .select('_id par lm updatedAt')
    .sort('-updatedAt')
    .populate({
      path: 'par',
      select: 'sn'
    })
    .exec((err, conversations) => {
      /* istanbul ignore if */
      if (err) {
        logger.error('getListConversations: Mongo ' + err);
        return io.to(socket.decoded.sn).emit('list-conversations', {
          error: err
        });
      } else {
        let participant;
        let cids = [];
        let lastMessageOfCids = [];
        console.log('list conversation DB ', JSON.stringify(conversations));
        if (conversations.length <= 0) {
          logger.error('getListConversations: No conversations found');
          return io.to(socket.decoded.sn).emit('list-conversations', {
            conversations: conversations,
            time: now
          });
        }

        conversations.forEach(conversation => {
          // Make the participant not include req userId
          participant = conversation.par;
          let index = participant.findIndex(i => {
            return i._id == socket.decoded._id;
          });
          participant.splice(index, 1);
          cids.push(conversation._id);
          lastMessageOfCids.push(conversation._id + socket.decoded._id);
        });

        console.log('lastMessageOfCids: ', lastMessageOfCids);

        Promise.all([
          client.hmget(
            config.keyRedis.lastSeenMsgOfNumber,
            lastMessageOfCids
          ),
          client.hmget(config.keyRedis.conversation, cids)
        ]).then(res => {
          const lastMessageId = res[0];
          const conversationsOnRedis = res[1];

          for (let i = 0; i < conversations.length; ++i) {
            let conversationOnRedis = JSON.parse(conversationsOnRedis[i]);
            if (
              conversations[i] &&
              conversationOnRedis &&
              conversationOnRedis.lm
            ) {
              conversations[i].lm = conversationOnRedis.lm;
            }

            let ss;

            if (conversations[i].lm.au == socket.decoded._id) {
              ss = true;
            } else {
              console.log('test in here');
              console.log(conversations[i].lm._id);
              console.log(lastMessageId[i]);
              if (conversations[i].lm._id == lastMessageId[i]) {
                ss = true;
              } else {
                ss = false;
              }
            }

            let modifyConver = {
              par: conversations[i].par,
              lm: conversations[i].lm,
              _id: conversations[i]._id,
              updatedAt: conversations[i].updatedAt,
              ss
            };

            listConversationsModify.push(modifyConver);
          }
          console.log(
            'list conversation after modify .... ',
            JSON.stringify(listConversationsModify)
          );
          return io.to(socket.decoded.sn).emit('list-conversations', {
            conversations: listConversationsModify,
            time: now
          });
        });
      }
    });
}

// Helper create-conversation
export function helperNewConversation(
  data,
  io,
  socket,
  recipientId,
  channelName,
  pub
) {
  clientGenKey.send_command('genkey', 'ConversationIDKey', (err, result) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('newConversation: Redis ' + err);
      return io
        .to(socket.decoded.sn)
        .emit('create-conversation', { status: false });
    } else {
      /* istanbul ignore if */

      if (result.length < 2) {
        logger.error('sendMessage: Redis result is wrong ' + result);
        return io
          .to(socket.decoded.sn)
          .emit('create-conversation genkey false', { status: false });
      }

      let cid = Long.fromBits(result[1], result[0]);

      let conversation = new Conversation({
        _id: cid,
        par: [socket.decoded._id, recipientId]
      });

      clientGenKey.send_command('genkey', 'MessageIDKey', (err, result) => {
        /* istanbul ignore if */
        if (err) {
          logger.error('newConversation: Redis ' + err);
          return io
            .to(socket.decoded.sn)
            .emit('create-conversation', { status: false });
        } else {
          /* istanbul ignore if */

          if (result.length < 2) {
            logger.error('sendMessage: Redis result is wrong ' + result);
            return io
              .to(socket.decoded.sn)
              .emit('create-conversation genkey false', { status: false });
          }

          let messageId = Long.fromBits(result[1], result[0]);

          let messageDb = new Message({
            _id: messageId,
            cid: conversation._id,
            body: removeSpaces(data.body),
            au: socket.decoded._id,
            re: data.recipient.sn,
            sa: new Date(Date.now())
          });

          const message = {
            _id: messageDb._id,
            cid: messageDb.cid,
            body: messageDb.body,
            au: messageDb.au,
            ausn: Number(socket.decoded.sn),
            ss: messageDb.ss,
            sa: messageDb.sa,
            re: data.recipient.sn
          };

          let lastMessage = {
            _id: messageDb._id,
            body: messageDb.body,
            au: messageDb.au,
            ausn: Number(socket.decoded.sn)
          };

          conversation = new Conversation({
            _id: cid,
            par: [socket.decoded._id, recipientId],
            lm: lastMessage,
            updatedAt: messageDb.sa
          });

          client.hset(
            config.keyRedis.conversation,
            conversation._id.toString(),
            JSON.stringify({
              par: conversation.par,
              lm: lastMessage
            }),
            err => {
              /* istanbul ignore if */
              if (err) {
                logger.error('newConversation: Redis ' + err);
                return io
                  .to(socket.decoded.sn)
                  .emit('create-conversation', { status: false });
              }
              console.log('pub. in.c');
              pub.send_command(
                'publish',
                constants.redisChannel,
                JSON.stringify({ message: message, type: 'm' }),
                constants.NumToHostName,
                message.re
              );

              Notification.pushNotification(message);

              clientBulk.rpush(
                keyBulkWrite,
                JSON.stringify({
                  op: 'in.c',
                  data: conversation
                }),
                err => {
                  /* istanbul ignore if */
                  if (err) {
                    logger.error('newConversation: Redis ' + err);
                    return io
                      .to(socket.decoded.sn)
                      .emit('create-conversation', {
                        status: false
                      });
                  } else {
                    clientBulk.rpush(
                      keyBulkWrite,
                      JSON.stringify({
                        op: 'in.m',
                        data: messageDb
                      }),
                      err => {
                        /* istanbul ignore if */
                        if (err) {
                          logger.error('newConversation: Redis ' + err);
                          return io
                            .to(socket.decoded.sn)
                            .emit('create-conversation', {
                              status: false
                            });
                        } else {
                          console.log('create-conversation');

                          io.to(socket.decoded.sn).emit('create-conversation', {
                            data: {
                              status: true,
                              cid: conversation._id,
                              _id: messageDb._id,
                              sa: messageDb.sa,
                              body: messageDb.body,
                              ss: messageDb.ss,
                              au: messageDb.au,
                              ausn: message.ausn,
                              re: message.re
                            }
                          });
                        }
                      }
                    );
                  }
                }
              );
            }
          );
        }
      });
    }
  });
}
