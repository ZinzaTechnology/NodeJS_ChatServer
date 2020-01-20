import * as statusCode from '../constants/statusCode';
import { NumToPinCode, TIME_TO_LIVE_ADAY } from '../constants/global';
import { client, clientBulk } from '../index';
import logger from '../../config/winston';
import * as helpers from '../middlewares/helpers';
import * as Language from '../middlewares/language';
import User from '../models/user';
import jwt from 'jsonwebtoken';
import config from '../../config/main';
import { pub } from '../index';
import { io } from '../../bin/server';
import * as constants from '../constants/global';

let keyBulkWrite = helpers.keyBulk();

export function setPinCode(req, res) {
  const { pincode } = req.body;

  let pinInfo = {
    pincode
  };

  const bearerToken = req.header('Authorization');
  const token = bearerToken.replace('Bearer ', '');

  console.log('token =', token);

  jwt.verify(token, config.secret, (err, decoded) => {
    /* istanbul ignore if */
    if (err) {
      return Language.getData(req, 'UNKNOW_ERROR').then(data => {
        res.status(statusCode.BAD_REQUEST).json({ error: data });
      });
    } else {
      // abridged code
      savePinCode(req, res, pinInfo);
    }
  });
}

function savePinCode(req, res, pinInfo) {
  client.set(
    // abridged code
    'EX',
    TIME_TO_LIVE_ADAY,
    err => {
      /* istanbul ignore if */
      if (err) {
        logger.error('savePinCode error: can NOT set to Redis ' + err);
        return Language.getData(req, 'PINCODE_CAN_NOT_SAVE').then(data => {
          res.status(statusCode.BAD_REQUEST).json({ error: data });
        });
      } else {
        res.status(statusCode.CREATED).end();
      }
    }
  );
}

export function verifyPinCode(req, res) {
  const { sn, did, pincode } = req.body;

  let userInfo = {
    // abridged code
  };

  User.findOne({ sn: Number(userInfo.sn) }, (err, user) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('get user Info: Mongo ' + err);
      return Language.getData(req, 'UNKNOW_ERROR').then(data => {
        res.status(statusCode.BAD_REQUEST).json({ error: data });
      });
    } else if (user == undefined) {
      return Language.getData(req, 'USER_NOT_FOUND').then(data => {
        res.status(statusCode.BAD_REQUEST).json({ error: data });
      });
    } else {
      // abridged code
      recoverNewDevice(req, res, userInfo, user);
    }
  });
}

function recoverNewDevice(req, res, userInfo, originUser) {
  client.get(NumToPinCode + ':' + userInfo.sn, (error, result) => {
    /* istanbul ignore if */
    if (error) {
      logger.error('checkExistPinCode error: can NOT get Redis ' + error);
      return Language.getData(req, 'PINCODE_NOT_EXIST').then(data => {
        res.status(statusCode.BAD_REQUEST).json({ error: data });
      });
    } else {
      logger.info('result=' + result + 'userInfo=', userInfo);

      if (result == null) {
        return Language.getData(req, 'PINCODE_NOT_EXIST').then(data => {
          res.status(statusCode.BAD_REQUEST).json({ error: data });
        });
      }
      let pincode = result.split(',')[0];

      if (pincode != userInfo.pincode) {
        return Language.getData(req, 'PINCODE_IS_NOT_MATCH').then(data => {
          res.status(statusCode.BAD_REQUEST).json({ error: data });
        });
      } else {
        let token = result.split(',')[1];
        addToBlacklistToken(token);
        delete userInfo.pincode;
        // abridged code
        logoutPreviewDevice(originUser);

        res.status(statusCode.OK).json({
          token: newToken,
          user: {
            // abridged code
          }
        });       

        // abridged code
        saveDataToDB(originUser);
      }
    }
  });
}

function saveDataToDB(originUser) {
  originUser.encryptToken(err => {
    /* istanbul ignore if */
    if (err) {
      logger.error('requestId: encrypt token err ' + err);
      return;
    }

    /*
     * Do NOT save user to DB now, because it is very slow
     * Store user in cache (redis) and use sync-service to save to DB.
     */
    clientBulk.rpush(
      keyBulkWrite,
      JSON.stringify({
        // abridged code
      }),
      err => {
        /* istanbul ignore if */
        if (err) {
          logger.error('requestId: save User to cache err ' + err);
          return;
        }
      }
    );
  });
}

function logoutPreviewDevice(userOrigin) {
  pub.send_command(
    'publish',
    constants.redisChannel,
    JSON.stringify({ userOrigin, type: 'l' }),
    constants.NumToHostName,
    userOrigin.sn
  );
  io.to(userOrigin.sn).emit('logout', { data: userOrigin.did });
}

function addToBlacklistToken(userToken) {
  client.sadd(config.keyRedis.jwtBlacklist, userToken, err => {
    /* istanbul ignore if */
    if (err) {
      logger.error('addToBlacklistToken error: can NOT set to Redis ' + err);
    }
  });
}
