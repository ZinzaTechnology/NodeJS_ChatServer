import * as constants from '../constants/global';
import { client } from '../index';
import logger from '../../config/winston';

const FCM = require('fcm-node');

var fcmCli = new FCM(constants.SERVER_API_KEY);

export function pushNotification(message) {
  console.log('pushNotification=', JSON.stringify(message));
  client.sismember(constants.NumIsOnline, message.re, (err, isMem) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('check Recived Num Is Online: ' + err);
    }
    if (isMem == 0) {
      /* istanbul ignore if */
      if (!message.title) {
        client.rpush(message.re, JSON.stringify(message));
      }

      getDeviceToken(message);
    }
  });
}

function getDeviceToken(message) {
  client.hget(constants.NumToDeviceToken, message.re, (err, result) => {
    let deviceToken = result;
    console.log('deviceToken = ', deviceToken);
    if (err || deviceToken == undefined || deviceToken == '') {
      logger.error('get Device Token: ' + err);
      return;
    } else {
      sendNotifyToFireBase(deviceToken, message);
    }
  });
}

function sendNotifyToFireBase(deviceToken, message) {
  var payload = {
    to: deviceToken,
    priority: 'high',
    notification: {
      //notification object
      title: message.title || message.ausn,
      body: message.body,
      sound: 'default',
      badge: '1'
    },
    data: {
      sender: message.ausn,
      type: message.title ? 'a' : 'm'
    }
  };
  fcmCli.send(payload, function(err, response) {
    if (err)
      console.log('error when push notification new message', err, response);
    else console.log('Successfully sent with response: ', response);
  });
}

/* istanbul ignore next */
export function sendSilentDataToDevice(deviceToken, message) {
  var payload = {
    to: deviceToken,
    priority: 'high',
    content_available: true,
    data: {
      logout: message
    }
  };
  fcmCli.send(payload, function(err, response) {
    if (err)
      console.log('error when push notification new message', err, response);
    else console.log('Successfully sent with response: ', response);
  });
}
