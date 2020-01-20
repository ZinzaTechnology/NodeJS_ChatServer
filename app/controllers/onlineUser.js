// import os from 'os';
import { client } from '../index';
import logger from '../../config/winston';
import { hostNamePattern } from '../constants/global';
import * as statusCode from '../constants/statusCode';
import * as Language from '../middlewares/language';
import * as constants from '../constants/global';

export function online(req, res) {
  let data = [];
  let length;
  client.keys(hostNamePattern, (err, result) => {
    if (err) {
      logger.error('Redis error: ' + err);
    }
    if (result.length == 0) {
      res.status(statusCode.OK).json({ info: 'No user is online' });
    }
    length = result.length;
    result.forEach(host => {
      client.smembers(host, (err, result) => {
        if (err) {
          logger.error('Redis error: ' + err);
        }
        let info = {
          Hostname: host,
          CCU: result.length
          // onlineUsers: result
        };
        data.push(info);
        if (data.length == length) {
          res.status(statusCode.OK).json(data);
        }
      });
    });
  });
}

// Check specified hostname
export function checkHostname(req, res) {
  client.smembers(req.params.hostname, (err, result) => {
    if (err) {
      logger.error('Redis error: ' + err);
    }
    res.status(statusCode.OK).json({
      // abridged code
    });
  });
}

// Check Online from list user;
export function checkOnline(req, res) {
  // Validate Data
  if (!req.body || !req.body.data) {
    return Language.getData(req, 'INVALID_PARAM').then(error => {
      res.status(statusCode.BAD_REQUEST).json({
        error
      });
    });
  }

  let data = req.body.data;

  if (data.length) {
    client.send_command(
      'checkonline',
      constants.NumIsOnline,
      data,
      (err, result) => {
        /* istanbul ignore if */
        if (err) {
          return logger.error('check online redis: ', err);
        }

        let modifyData = [];
        for (let i = 0; i < data.length; i++) {
          modifyData.push({
            // abridged code
          });
        }

        console.log('Modify list Online contact', modifyData);

        return res.status(statusCode.OK).json({
          data: modifyData
        });
      }
    );
  }
}
