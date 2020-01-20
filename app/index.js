import express from 'express';
import morgan from 'morgan';
import swaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import mongoose from 'mongoose';
import config from '../config/main';
import router from './routes/index';
import bodyParser from 'body-parser';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { setStateOfServer } from './middlewares/setRedis';
import Prometheus from 'prom-client';
import logger from '../config/winston';
import os from 'os';

//var ExpressTranslate = require('express-translate');

Redis.Promise.onPossiblyUnhandledRejection(error => {
  /* istanbul ignore next */
  logger.error('Redis error: ' + error);
});

// const expressTranslate = new ExpressTranslate();

// expressTranslate.addLanguage('en', require('../config/language.en.json'));
// expressTranslate.addLanguage('jp', require('../config/language.jp.json'));

// export const et = expressTranslate;

// function getLanguage(req){
//   console.log(req.headers);
//   let lang= req.headers['x-localization'];
//   if (lang != 'jp')
//     lang = 'en';
//   return lang;
// }

var redisInstance;
var redisInstanceBulk;

var usedPubInstance;
var pubInstance;
var pubInstance1;

var subInstance;
var subInstance1;

/* istanbul ignore if */
if (config.env === 'staging' || config.env === 'production') {
  redisInstance = new Redis({
    sentinels: [
      { host: config.redis.sentinel0, port: config.redis.sentinelPort },
      { host: config.redis.sentinel1, port: config.redis.sentinelPort },
      { host: config.redis.sentinel2, port: config.redis.sentinelPort }
    ],
    name: config.redis.masterGroupName
  });
  redisInstanceBulk = new Redis({
    sentinels: [
      { host: config.redis.sentinel01, port: config.redis.sentinelPort1 },
      { host: config.redis.sentinel11, port: config.redis.sentinelPort1 },
      { host: config.redis.sentinel21, port: config.redis.sentinelPort1 }
    ],
    name: config.redis.masterGroupName1
  });

  pubInstance = new Redis({
    sentinels: [
      {
        host: config.redis.sentinelPubSub0,
        port: config.redis.sentinelPortPubSub
      },
      {
        host: config.redis.sentinelPubSub1,
        port: config.redis.sentinelPortPubSub
      },
      {
        host: config.redis.sentinelPubSub2,
        port: config.redis.sentinelPortPubSub
      }
    ],
    name: config.redis.masterGroupNamePubSub
  });
  pubInstance1 = new Redis({
    sentinels: [
      {
        host: config.redis.sentinelPubSub01,
        port: config.redis.sentinelPortPubSub1
      },
      {
        host: config.redis.sentinelPubSub11,
        port: config.redis.sentinelPortPubSub1
      },
      {
        host: config.redis.sentinelPubSub21,
        port: config.redis.sentinelPortPubSub1
      }
    ],
    name: config.redis.masterGroupNamePubSub1
  });

  subInstance = new Redis({
    sentinels: [
      {
        host: config.redis.sentinelPubSub0,
        port: config.redis.sentinelPortPubSub
      },
      {
        host: config.redis.sentinelPubSub1,
        port: config.redis.sentinelPortPubSub
      },
      {
        host: config.redis.sentinelPubSub2,
        port: config.redis.sentinelPortPubSub
      }
    ],
    name: config.redis.masterGroupNamePubSub
  });
  subInstance1 = new Redis({
    sentinels: [
      {
        host: config.redis.sentinelPubSub01,
        port: config.redis.sentinelPortPubSub1
      },
      {
        host: config.redis.sentinelPubSub11,
        port: config.redis.sentinelPortPubSub1
      },
      {
        host: config.redis.sentinelPubSub21,
        port: config.redis.sentinelPortPubSub1
      }
    ],
    name: config.redis.masterGroupNamePubSub1
  });
} else {
  console.log('development mode');
  redisInstance = new Redis({
    host: config.redis.host,
    port: config.redis.port
  });
  redisInstanceBulk = new Redis({
    host: config.redis.host1,
    port: config.redis.port1
  });
  pubInstance = new Redis({
    host: config.redis.hostPubSub,
    port: config.redis.portPubSub
  });
  pubInstance1 = new Redis({
    host: config.redis.hostPubSub1,
    port: config.redis.portPubSub1
  });
  subInstance = new Redis({
    host: config.redis.hostPubSub,
    port: config.redis.portPubSub
  });
  subInstance1 = new Redis({
    host: config.redis.hostPubSub1,
    port: config.redis.portPubSub1
  });
}

let regex = /\w+$/g;
let indexOfHost = parseInt(Number(regex.exec(os.hostname())[0]));
console.log('socket: indexOfHost', indexOfHost, os.hostname());
/* istanbul ignore if */
if (indexOfHost < config.numSocketPubToEachCache) {
  usedPubInstance = pubInstance;
} else {
  usedPubInstance = pubInstance1;
}

export const clientBulk = redisInstanceBulk;
export const client = redisInstance;

export const clientGenKey = new Redis({
  host: config.redisGenKey.host,
  port: config.redisGenKey.port
});

export const pub = usedPubInstance;
export const pubSetNumToHostName = pubInstance;
export const pubSetNumToHostName1 = pubInstance1;

export const sub = subInstance;
export const sub1 = subInstance1;

require('events').EventEmitter.defaultMaxListeners = 0;

export default () => {
  let app = express();
  let redisStore = connectRedis(session);

  let ccu = new Prometheus.Gauge({
    name: 'CCU_total',
    help: 'Concurrent User'
  });
  app.use(
    session({
      // abridged code
    })
  );
  global.stateOfServer = setStateOfServer();
  global.ccu = 0;

  if (config.env == 'development') {
    const swaggerDocs = YAML.load(
      path.join(__dirname, '/swagger/swagger.yaml')
    );

    // Docs
    app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));
  }

  setInterval(() => {
    ccu.set(global.ccu);
  }, 500);

  // Retry connection
  const connectWithRetry = () => {
    logger.error('MongoDB connection with retry');
    return mongoose.connect(config.database);
  };

  mongoose.connection.on('error', err => {
    logger.error('Database connection error: ' + err);
    setTimeout(connectWithRetry, 5000);
  });

  mongoose.connection.on('connected', () => {
    logger.info('Database connected!');
  });

  mongoose.connect(config.database, {
    // abridged code
  });

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // app.use((req, res, next) => {
  //   et.localeKey = getLanguage(req);
  //   next();
  // });

  app.use(
    morgan('dev', {
      skip: function(req, res) {
        return res.statusCode < 400;
      },
      stream: process.stderr
    })
  );

  app.use(
    morgan('dev', {
      skip: function(req, res) {
        return res.statusCode >= 400;
      },
      stream: process.stdout
    })
  );

  router(app);

  return app;
};
