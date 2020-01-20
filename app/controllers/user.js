import User from '../models/user';
import * as statusCode from '../constants/statusCode';
import { filterUserInfo, removeSpaces } from '../middlewares/helpers';
import { newNumber } from '../controllers/authentication';
import config from '../../config/main';
import {
  maxLengthName,
  NumToDeviceToken,
  NumIsOnline
} from '../constants/global';
import { client } from '../index';
import logger from '../../config/winston';
import * as Language from '../middlewares/language';
import * as constants from '../constants/global';
import * as Notification from '../utils/notification';

// Update User Info
export function updateInfo(req, res, next) {
  const { name } = req.body;

  User.findOne({ _id: req.user._id }, (err, user) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('updateInfo: Mongo ' + err);
      return Language.getData(req, 'UNKNOW_ERROR').then(data => {
        res.status(statusCode.BAD_REQUEST).json({ error: data });
      });
    }

    /* istanbul ignore next */
    let firstNameLength = name ? removeSpaces(name).length : 0;

    if (firstNameLength > maxLengthName) {
      return Language.getData(req, 'YOUR_NAME_IS_TOO_LONG').then(data => {
        res.status(statusCode.UNPROCESSABLE_ENTITY).json({ error: data });
      });
    }

    user.name = removeSpaces(name);

    user.save(err => {
      /* istanbul ignore if */
      if (err) {
        logger.error('updateInfo: Mongo ' + err);
        return next(err);
      }
      return res.status(statusCode.OK).json({ Info: filterUserInfo(user) });
    });
  });
}

// Reset Number
export function resetNumber(req, res, next) {
  newNumber(req, res, next);
}

// Delete Number
export function deleteNumber(req, res) {
  client.hdel(constants.NumToDeviceToken, req.user.sn, err => {
    /* istanbul ignore if */
    if (err) {
      console.log('delete Number to device token err: ', err);
    }

    res.status(statusCode.OK).json({ Info: 'Delete Number Success' });
  });
}

export function sendDeviceToken(req, res) {
  const { sn, deviceToken } = req.body;

  console.log('device token=', deviceToken);

  client.hset(NumToDeviceToken, sn.replace(' ', ''), deviceToken, err => {
    /* istanbul ignore if */
    if (err) {
      logger.error('sendDeviceToken error: can NOT set to Redis ' + err);
    }
    res.status(statusCode.OK).json({ Info: 'Set device token ok' });
  });
}

/* istanbul ignore next */
export function getAllDeviceToken(req, res) {
  client.hgetall(NumToDeviceToken, (err, result) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('getAllDeviceToken error: canot get Device Token ' + err);
    }
    res.status(statusCode.OK).json({ deviceTokens: result });
  });
}

/* istanbul ignore next */
export function getAllUserOnline(req, res) {
  client.smembers(NumIsOnline, (err, result) => {
    /* istanbul ignore next */
    if (err) {
      logger.error('getAllUserOnline error: canot get all online user ' + err);
    }
    res.status(statusCode.OK).json({ onlineUser: result });
  });
}

// Get User By Sample Number
export function getUserByNumber(req, res) {
  const { sn } = req.params;

  User.findOne({ sn }, (err, user) => {
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
      res.status(statusCode.OK).json({
        sn: user.sn,
        name: user.name
      });
    }
  });
}

export function addContact(data, io, socket, pub) {
  console.log('Data add contact = ', data);
  /* istanbul ignore if */
  if (!data.sn) {
    return;
  }

  client.hexists(config.keyRedis.sn, data.sn, (err, existed) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('addContact: Redis ' + err);
      return;
    }

    /* istanbul ignore if */
    if (existed == 0) {
      return;
    }

    // Get language
    client.hget(config.keyRedis.SampleLanguage, data.sn, (err, language) => {
      /* istanbul ignore if */
      if (err) {
        logger.error('getLanguage: Redis ' + err);
        return;
      }

      let ausn = socket.decoded.sn.toString();
      let req = {
        headers: {
          'x-localization': language
        }
      };

      Promise.all([
        Language.getData(req, 'ADD_CONTACT_TITLE'),
        Language.getData(req, 'ADD_CONTACT_CONTENT')
      ]).then(res => {
        let message = {
          re: data.sn,
          body: res[1].replace(
            // abridged code
          ),
          ausn: socket.decoded.sn,
          title: res[0]
        };

        // Push notification when user off
        Notification.pushNotification(message);
      });

      pub.send_command(
        'publish',
        constants.redisChannel,
        JSON.stringify({
          // abridged code
        }),
        constants.NumToHostName,
        data.sn
      );
    });
  });
}
