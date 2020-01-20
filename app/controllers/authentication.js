import User from '../models/user';
import Conversation from '../models/conversation';
import Message from '../models/message';
import * as helpers from '../middlewares/helpers';
import * as statusCode from '../constants/statusCode';
import config from '../../config/main';
import { client, clientGenKey, clientBulk } from '../index';
import logger from '../../config/winston';
import mongoose from 'mongoose';
require('mongoose-long')(mongoose);

let keyBulkWrite = helpers.keyBulk();
var Long = mongoose.Types.Long;

// New Sample Number
export function newNumber(req, res, next) {
  genNumber(req, res, next);
}

function requestGenNewNumbers(numRequest) {
  if (numRequest > 0) {
    let arrRequest = [];
    for (let i = 0; i < numRequest; ++i) {
      arrRequest.push(1);
    }
    return client.lpush(config.keyRedis.requestNewSn, arrRequest, err => {
      /* istanbul ignore next */
      if (err) {
        logger.error('requestGenNewNumbers: gen ' + err);
        return requestGenNewNumbers(numRequest);
      }
    });
  }
}

function genNumber(req, res, next) {
  return client.spop(config.keyRedis.newSn, (err, value) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('requestId: Redis ' + err);
      return next(err);
    }
    console.log('genNumber', value);
    /* istanbul ignore if */
    if (!value) {
      logger.error('requestId: dont have key in newNumbers ' + err);
      return genNumber(req, res, next);
    }
    if (value) {
      requestGenNewNumbers(1);
      if (req.user) {
        return saveReset(req, res, next, value);
      } else {
        return saveRegister(req, res, next, value);
      }
    }
  });
}

function saveRegister(req, res, next, randomNumber) {
  clientGenKey.send_command('genkey', 'UserIDKey', (err, result) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('requestId: genUserId ' + err);
      return next(err);
    } else {
      /* istanbul ignore if */
      if (result.length < 2) {
        logger.error('sendMessage: Redis result is wrong ' + result);
        return next(err);
      }
      // abridged code

      client.hset(config.keyRedis.sn, user.sn, user._id.toString(), err => {
        /* istanbul ignore if */
        if (err) {
          logger.error('requestId: Redis ' + err);
          return next(err);
        }

        // Save To Redis
        saveToRedis(req, res, next, user);
      });
    }
  });
}

function saveReset(req, res, next, randomNumber) {
  clientGenKey.send_command('genkey', 'UserIDKey', (err, result) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('requestId: genUserId ' + err);
      return next(err);
    } else {
      /* istanbul ignore if */
      if (result.length < 2) {
        logger.error('sendMessage: Redis result is wrong ' + result);
        return next(err);
      }
      // abridged code

      client.hset(config.keyRedis.sn, user.sn, user._id.toString(), err => {
        /* istanbul ignore if */
        if (err) {
          logger.error('requestId: Redis ' + err);
          return next(err);
        }

        // Save To Redis
        saveToRedis(req, res, next, user);
      });
    }
  });
}

function saveToRedis(req, res, next, user) {
  const userInfo = helpers.filterUserInfo(user);
  const createdToken = helpers.generateToken(userInfo);
  user.token = createdToken;

  console.log('user.token=', user.token);

  user.encryptToken(err => {
    /* istanbul ignore if */
    if (err) {
      logger.error('requestId: encrypt token err ' + err);
      return next(err);
    }

    /*
     * Do NOT save user to DB now, because it is very slow
     * Store user in cache (redis) and use sync-service to save to DB.
     */
    clientBulk.rpush(
      keyBulkWrite,
      JSON.stringify({
        op: 'in.u',
        data: user
      }),
      err => {
        /* istanbul ignore if */
        if (err) {
          logger.error('requestId: save User to cache err ' + err);
          return next(err);
        }

        res.status(statusCode.CREATED).json({
          // abridged code
        });
      }
    );
  });
}

/* istanbul ignore next */
export function genSnForTestFromDB(req, res, next) {
  User.find()
    .select('_id sn token')
    .limit(100000)
    .exec((err, users) => {
      if (err) {
        console.log('error ' + err);
        next();
      }
      var len = users.length;
      console.log(len);
      var preHostName = 'stress-test-';

      var stateFulSetSeq = 0;
      for (var i = 0; i < len; ++i) {
        console.log(users[i]);
        var k = 0;
        var hostName = preHostName + stateFulSetSeq;
        for (; k < 1000 && i < len; ++k, ++i) {
          client.hset(
            hostName,
            k,
            JSON.stringify({
              // abridged code
            })
          );
        }
        stateFulSetSeq++;
      }
    });
}

/* istanbul ignore next */
export function removeConversationAndMessageForStressTest(req, res, next) {
  Conversation.remove({}, err => {
    console.log('remove conversation ' + err);
  });
  Message.remove({}, err => {
    console.log('remove mesasge ' + err);
  });
  next();
}
