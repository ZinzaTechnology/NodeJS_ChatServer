import jwt from 'jsonwebtoken';
import config from '../../config/main';
import * as constants from '../constants/global';
import os from 'os';

export function filterUserInfo(request) {
  const getUserInfo = {
    _id: request._id,
    name: request.name,
    did: request.did,
    sn: request.sn
  };
  return getUserInfo;
}

export function generateToken(user) {
  return jwt.sign(user, config.secret, {
    expiresIn: constants.tokenExpireTime
  });
}

/* istanbul ignore next */
export function getRandomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function removeSpaces(string) {
  let arrStr = string.split(' ');
  let modifyArr = [];

  for (let i = 0; i < arrStr.length; i++) {
    if (arrStr[i] !== '') {
      modifyArr.push(arrStr[i]);
    }
  }

  return modifyArr.join(' ');
}

export function generateChannelName(Number1, Number2) {
  let channelName =
    Number1 < Number2
      ? Number1 + '-' + Number2
      : Number2 + '-' + Number1;
  return channelName;
}

export function keyBulk() {
  /* istanbul ignore else */
  if (config.env === 'development') {
    return config.keyRedis.bulkWrite;
  } else {
    return (
      os.hostname().replace(/^\w+/, config.hostKey) +
      '-' +
      config.keyRedis.bulkWrite
    );
  }
}
