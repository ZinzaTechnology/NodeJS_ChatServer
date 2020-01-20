import {client} from '../index';
import config from '../../config/main';
import logger from '../../config/winston';
import * as statusCode from '../constants/statusCode';

export function keyId (req, res) {
  client.mget(config.keyRedis.userId, config.keyRedis.cid, config.keyRedis.messageId, (err, result) => {
    if (err) {
      logger.error('Redis error: ' + err);
    }
    
    res.status(statusCode.OK).json({userId: result[0], cid: result[1], messageId: result[2]});
  });
}