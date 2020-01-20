import User from '../models/user';
import Conversation from '../models/conversation';
import Message from '../models/message';
import config from '../../config/main';
import {
  READY,
  NOT_READY,
  redisChannel,
  numInitNewNumber
} from '../constants/global';
//import async from 'async';
import { generateChannelName } from './helpers';
import logger from '../../config/winston';
import os from 'os';

import { client, sub, sub1 } from '../index';
import * as Language from './language';
var async = require('async');

function unsubAndResub() {
  sub.unsubscribe(redisChannel);
  sub.send_command('client', ['setname', os.hostname()]);
  sub.subscribe(redisChannel);

  sub1.unsubscribe(redisChannel);
  sub1.send_command('client', ['setname', os.hostname()]);
  sub1.subscribe(redisChannel);
}
function genNewSample() {
  client.exists(config.keyRedis.newSn, exist => {
    /* istanbul ignore else */
    if (!exist) {
      let numRequest = numInitNewNumber;
      if (numRequest > 0) {
        let arrRequest = [];
        for (let i = 0; i < numRequest; ++i) {
          arrRequest.push(1);
        }
        client.lpush(config.keyRedis.requestNewSn, arrRequest, err => {
          /* istanbul ignore if */
          if (err) {
            logger.debug('genNewSample: Cant request gen 10000 newSample Numbers');
          }
        });
      }
    }
  });
}

export function setStateOfServer() {
  let hashNumber,
    hashConversation,
    setChannelName,
    userLength,
    conversationLength,
    messageLength;
  async.waterfall(
    [
      cb => {
        client.del(os.hostname(), cb);
      },
      // Check Keys are existed or not
      (results, cb) => {
        client.hlen(config.keyRedis.sn, cb);
      },
      // If not querry database and add to Redis
      (results, cb) => {
        Language.importLanguageData();
        if (results != 0) {
          logger.debug('State of server: Already have keys in Redis!');
          // Redis PUBSUB
          unsubAndResub();
          global.stateOfServer = READY;
          logger.debug('State of server: ' + global.stateOfServer);
        } else {
          logger.debug('State of server: Have no key in Redis!');
          global.stateOfServer = NOT_READY;
          logger.debug('State of server: ' + global.stateOfServer);

          User.find()
            .select('sn')
            .exec(cb);
        }
      },
      (results, cb) => {
        if (results.length == 0) {
          logger.debug('State of server: Empty Database!');
          //genNumbver
          genNewSample();
          setTimeout(() => {
            // Redis PUBSUB
            unsubAndResub();
            global.stateOfServer = READY;
            logger.debug('State of server: ' + global.stateOfServer);
          }, 1000);
        } else {
          userLength = results.length;
          logger.debug('State of server: Database has users!');
          hashNumber = [];
          results.forEach(user => {
            hashNumber.push(user.sn);
            hashNumber.push(user._id.toString());
          });
          client.hmset(config.keyRedis.sn, hashNumber, cb);
        }
      },
      (results, cb) => {
        logger.debug('State of server: Hash Number');
        //genNumbver
        genNewSample();
        client.set(config.keyRedis.userId, userLength, cb);
      },
      (results, cb) => {
        logger.debug('State of server: String userId');
        Conversation.find({})
          .populate({
            path: 'par',
            select: 'sn'
          })
          .exec(cb);
      },
      (results, cb) => {
        if (results.length == 0) {
          logger.debug('State of server: Database has no conversation!');
          setTimeout(() => {
            // Redis PUBSUB
            unsubAndResub();
            global.stateOfServer = READY;
            logger.debug('State of server: ' + global.stateOfServer);
          }, 1000);
        } else {
          conversationLength = results.length;
          logger.debug('State of server: Database has conversations!');
          hashConversation = [];
          setChannelName = [];
          results.forEach(conversation => {
            hashConversation.push(conversation._id.toString());
            hashConversation.push(
              JSON.stringify({
                par: [conversation.par[0]._id, conversation.par[1]._id]
              })
            );
            let channelName = generateChannelName(
              conversation.par[0].sn,
              conversation.par[1].sn
            );
            setChannelName.push(channelName);
          });
          console.log('hash converstation=', hashConversation);
          client.hmset(config.keyRedis.conversation, hashConversation, cb);
        }
      },
      (results, cb) => {
        logger.debug('State of server: Hash conversation');
        client.set(config.keyRedis.cid, conversationLength, cb);
      },
      (results, cb) => {
        logger.debug('State of server: String conversationId');
        client.sadd(config.keyRedis.channelName, setChannelName, cb);
      },
      (results, cb) => {
        logger.debug('State of server: Set channelName');
        Message.countDocuments().exec(cb);
      },
      (results, cb) => {
        messageLength = results;
        client.set(config.keyRedis.messageId, messageLength, cb);
      },
      (results, cb) => {
        logger.debug('State of server: String messageId');
        setTimeout(() => {
          // Redis PUBSUB
          unsubAndResub();
          global.stateOfServer = READY;
          logger.debug('State of server: ' + global.stateOfServer);
          cb(null, results);
        }, 1000);
      }
    ],
    err => {
      /* istanbul ignore if */
      if (err) {
        logger.error('State of Server: ' + err);
      }
    }
  );
}
