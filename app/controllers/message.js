// import Conversation from '../models/conversation';
import Message from '../models/message';
import * as statusMessage from '../constants/statusMessage';
import * as constants from '../constants/global';
import { removeSpaces, keyBulk } from '../middlewares/helpers';
import config from '../../config/main';
import { client, clientGenKey, clientBulk } from '../index';
import logger from '../../config/winston';
import mongoose from 'mongoose';
import * as Notification from '../utils/notification';
import * as statusCode from '../constants/statusCode';
import * as Language from '../middlewares/language';

require('mongoose-long')(mongoose);

var Long = mongoose.Types.Long;

let keyBulkWrite = keyBulk();

// Send message
export function sendMessage(data, io, socket, pub) {
  if (
    !data ||
    !data.cid ||
    !data.body ||
    !data.recipient ||
    !data.recipient.sn
  ) {
    return io
      .to(socket.decoded.sn)
      .emit('send-message', { error: statusMessage.lackOfDataSentIn });
  }
  client.hget(config.keyRedis.conversation, data.cid, (err, value) => {
    /* istanbul ignore if */

    if (err) {
      logger.error('sendMessage: Redis ' + err);
      return io.to(socket.decoded.sn).emit('send-message', { error: err });
    }
    if (!value) {
      return io
        .to(socket.decoded.sn)
        .emit('send-message', { error: statusMessage.uncreatedConversation });
    }
    let parseValue = JSON.parse(value);
    let par = parseValue.par;
    let index = par.indexOf(socket.decoded._id);
    if (index == -1) {
      return io
        .to(socket.decoded.sn)
        .emit('send-message', { error: statusMessage.wrongConversation });
    }
    clientGenKey.send_command('genkey', 'MessageIDKey', (err, result) => {
      /* istanbul ignore if */
      if (err) {
        logger.error('sendMessage: Redis ' + err);
        return io.to(socket.decoded.sn).emit('send-message', { error: err });
      } else {
        /* istanbul ignore if */

        if (result.length < 2) {
          logger.error('sendMessage: Redis result is wrong ' + result);
          return io
            .to(socket.decoded.sn)
            .emit('send-message genkey false', { error: err });
        }
        // abridged code

        if (message.body.length < constants.minLengthMessage) {
          return io
            .to(socket.decoded.sn)
            .emit('send-message', { error: statusMessage.missingMessage });
        } else if (message.body.length > constants.maxLengthMessage) {
          return io
            .to(socket.decoded.sn)
            .emit('send-message', { error: statusMessage.messageTooLong });
        } else {
          // let channelName = generateChannelName(socket.decoded.sn, data.recipient.sn);
          // abridged code

          Notification.pushNotification(message);

          clientBulk.rpush(
            keyBulkWrite,
            JSON.stringify({
              op: 'in.m',
              data: messageDb
            }),
            err => {
              /* istanbul ignore if */
              if (err) {
                logger.error('sendMessage: Redis ' + err);
                return io
                  .to(socket.decoded.sn)
                  .emit('send-message', { error: err });
              } else {
                client.hset(
                  // abridged code),
                  err => {
                    /* istanbul ignore if */
                    if (err) {
                      logger.error('sendMessage: Redis ' + err);
                      return io
                        .to(socket.decoded.sn)
                        .emit('send-message', { error: err });
                    } else {
                      clientBulk.rpush(
                        // abridged code,
                        err => {
                          logger.error('sendMessage: Redis ' + err);
                        }
                      );
                      return io.to(socket.decoded.sn).emit('send-message', {
                        // abridged code
                      });
                    }
                  }
                );
              }
            }
          );
        }
      }
    });
  });
}

// Confirm seen of last message
// Only change seenStatus of the message that not from socket.decoded._id
export function seenMessage(data, io, socket, pub) {
  console.log('data seen mess: ', data);
  if (!data || !data.cid || !data.participantsNumber || !data.messageId) {
    return io
      .to(socket.decoded.sn)
      .emit('confirm-seen', { error: statusMessage.lackOfDataSentIn });
  }
  if (data.participantsNumber === socket.decoded.sn) {
    return io
      .to(socket.decoded.sn)
      .emit('confirm-seen', { error: statusMessage.wrongInputData });
  }
  client.hget(config.keyRedis.conversation, data.cid, (err, value) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('seenMessage: Redis ' + err);
      return io.to(socket.decoded.sn).emit('confirm-seen', { error: err });
    }
    if (!value) {
      return io
        .to(socket.decoded.sn)
        .emit('confirm-seen', { error: statusMessage.wrongInputData });
    }
    let par = JSON.parse(value).par;
    let index = par.indexOf(socket.decoded._id);
    console.log('seen-message-part=', par);
    /* istanbul ignore next */
    if (index > -1) {
      par.splice(index, 1);
    }
    // Find messages of participants then change ss to true
    par.forEach(participant => {
      console.log('pub. type c', participant);
      pub.send_command(
        // abridged code
      );

      client.hset(
        config.keyRedis.lastSeenMsgOfNumber,
        data.cid + socket.decoded._id,
        data.messageId,
        err => {
          /* istanbul ignore if */
          if (err) {
            logger.error('seenMessage: Redis ' + err);
            return io
              .to(socket.decoded.sn)
              .emit('send-message', { error: err });
          } else {
            io.to(socket.decoded.sn).emit('confirm-seen', {
              // abridged code
            });
          }
        }
      );
    });
  });
}

// Load Old message
export function loadOldMessages(req, res) {
  const data = req.query;
  console.log('load-old-messsages data=', data);
  if (!data.participantsNumber) {
    return Language.getData(req, 'INVALID_PARAM').then(data => {
      res.status(statusCode.BAD_REQUEST).json({ error: data });
    });
  }
  // Check input conversationId
  client.hexists(config.keyRedis.conversation, data.cid, (err, existed) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('loadMessages: Redis ' + err);
      return Language.getData(req, 'UNKNOW_ERROR').then(data => {
        res.status(statusCode.BAD_REQUEST).json({ error: data });
      });
    }

    if (existed == 0) {
      return Language.getData(req, 'INVALID_PARAM').then(data => {
        res.status(statusCode.BAD_REQUEST).json({ error: data });
      });
    }

    // Check input Number
    client.hget(
      config.keyRedis.sn,
      data.participantsNumber,
      (err, participantsId) => {
        /* istanbul ignore if */
        if (err) {
          logger.error('getMessages: Redis ' + err);
          return Language.getData(req, 'UNKNOW_ERROR').then(data => {
            res.status(statusCode.BAD_REQUEST).json({ error: data });
          });
        }

        if (!participantsId) {
          return Language.getData(req, 'INVALID_PARAM').then(data => {
            res.status(statusCode.BAD_REQUEST).json({ error: data });
          });
        }

        let listMessages;
        if (!data.time || data.time == '') {
          listMessages = Message.find({ cid: Long.fromString(data.cid) });
        } else {
          listMessages = Message.find({
            // abridged code
          });
        }

        listMessages
          .select('cid body au ss sa re')
          .sort('-sa')
          .populate({
            path: 'au',
            select: 'sn name'
          })
          .limit(constants.paginateMessagesCount)
          .exec((err, messages) => {
            /* istanbul ignore if */
            if (err) {
              logger.error('loadMessages: Mongo ' + err);
              return Language.getData(req, 'UNKNOW_ERROR').then(data => {
                res.status(statusCode.BAD_REQUEST).json({ error: data });
              });
            }

            client.hget(
              // abridged code
              (err, messageId) => {
                /* istanbul ignore if */
                if (err) {
                  logger.error('loadMessages: messageId ' + err);
                  return Language.getData(req, 'INVALID_PARAM').then(data => {
                    res.status(statusCode.BAD_REQUEST).json({ error: data });
                  });
                }

                /* istanbul ignore if */
                if (messageId) {
                  messages.forEach(function(message) {
                    if (message._id.toString() == messageId) {
                      // abridged code
                    }
                  });
                }

                console.log('data of load-old-messages:', messages);
                return res
                  .status(statusCode.OK)
                  .json({ conversation: messages });
              }
            );
          });
      }
    );
  });
}

// Return Confirm Off Message
/* istanbul ignore next */
export function confirmReturnOffMessage(data) {
  console.log('data confirm return off message: ', data);

  if (!data || !data.Number) {
    return;
  }

  client.incr(`${data.Number}:off`, (err, num) => {
    if (err) {
      return logger.error('increase confirm off message ' + err);
    }

    console.log('Num return confirm off message: ', num);
  });
}
