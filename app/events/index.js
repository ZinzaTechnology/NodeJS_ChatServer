import * as conversationController from '../controllers/conversation';
import * as messageController from '../controllers/message';
import * as userController from '../controllers/user';
import * as Version from '../controllers/version';
import jwt from 'jsonwebtoken';
import config from '../../config/main';
import logger from '../../config/winston';
import {
  pub,
  sub,
  sub1,
  pubSetNumToHostName,
  pubSetNumToHostName1
} from '../index';
import { io } from '../../bin/server';
import os from 'os';
import { client } from '../index';
import * as constants from '../constants/global';

/* istanbul ignore next */
sub.on('message', (channelName, message) => {
  console.log('sub.on', message);
  let parseMessage = JSON.parse(message);
  //type confirm seen
  if (parseMessage.type === 'c') {
    console.log('sub.on', channelName, parseMessage.re);
    io.to(parseMessage.re).emit('return-confirm-seen', {
      // abridged code
    });
  }
  //type message
  if (parseMessage.type === 'm') {
    console.log('sub.on', channelName, parseMessage.message.re);
    io.to(parseMessage.message.re).emit('return-message', {
      // abridged code
    });
  }
  // type logout
  if (parseMessage.type === 'l') {
    console.log('sub.on', channelName, parseMessage);
    io.to(parseMessage.userOrigin.sn).emit('logout', {
      // abridged code
    });
  }
  // type add contact
  if (parseMessage.type === 'a') {
    console.log('sub.on', channelName, parseMessage.ausn);
    io.to(parseMessage.sn).emit('add-contact', {
      // abridged code
    });
  }
});

/* istanbul ignore next */
sub1.on('message', (channelName, message) => {
  console.log('sub1.on', message);
  let parseMessage = JSON.parse(message);
  //type confirm seen
  if (parseMessage.type === 'c') {
    console.log('sub1.on', channelName, parseMessage.re);
    io.to(parseMessage.re).emit('return-confirm-seen', {
      // abridged code
    });
  }
  //type message
  if (parseMessage.type === 'm') {
    console.log('sub1.on', channelName, parseMessage.message.re);
    io.to(parseMessage.message.re).emit('return-message', {
      // abridged code
    });
  }
  // type logout
  if (parseMessage.type === 'l') {
    console.log('sub1.on', channelName, parseMessage);
    io.to(parseMessage.userOrigin.sn).emit('logout', {
      // abridged code
    });
  }
  // type add contact
  if (message.type === 'a') {
    console.log('sub1.on', channelName, parseMessage.ausn);
    io.to(parseMessage.sn).emit('add-contact', {
      // abridged code
    });
  }
});

function checkAndKick(decoded, token) {
  client.sismember(config.keyRedis.jwtBlacklist, token, (err, isMem) => {
    /* istanbul ignore if */
    if (err) {
      console.log('check blacklist : Redis ' + err);
    }
    /* istanbul ignore if */
    if (isMem == 1) {
      setTimeout(() => {
        console.log('process kick blacklist');
        io.to(decoded.sn).emit('logout', { data: decoded.did });
      }, 2000);
    }
    console.log('blacklist process');
  });
}

export default io => {
  io.use((socket, next) => {
    /* istanbul ignore else */
    console.log('handsake=', socket.handshake.query);
    if (socket.handshake.query && socket.handshake.query.token) {
      jwt.verify(
        socket.handshake.query.token,
        config.secret,
        (err, decoded) => {
          /* istanbul ignore if */
          if (err) return next(new Error('Authentication error'));
          socket.decoded = decoded;
          next();
        }
      );
    } else {
      /* istanbul ignore next */
      return next(new Error('Authentication error'));
    }
  }).on('connection', socket => {
    let token = socket.handshake.query.token;
    let language = socket.handshake.query['x-localization'];
    let versionClient = {
      v: socket.handshake.query.v,
      b: socket.handshake.query.b,
      language
    };
    console.log('language: ', language);
    console.log(
      socket.decoded.sn + ' has connected.',
      'decode=' + JSON.stringify(socket.decoded)
    );
    console.log('version client', JSON.stringify(versionClient));
    Version.checkVersion(versionClient, io, socket);
    client.hset(
      config.keyRedis.SampleLanguage,
      socket.decoded.sn,
      language,
      err => {
        /* istanbul ignore if */
        if (err) {
          logger.error('Redis set language error: ' + err);
        }
      }
    );
    checkAndKick(socket.decoded, token);

    global.ccu += 1;
    client.sadd(os.hostname(), socket.decoded.sn, err => {
      /* istanbul ignore if */
      if (err) {
        logger.error('Redis hostname error: ' + err);
      }
    });
    client.sadd(constants.NumIsOnline, socket.decoded.sn, err => {
      /* istanbul ignore if */
      if (err) {
        logger.error('Redis NumIsOnline error: ' + err);
      }

      client.llen(socket.decoded.sn, (err, lenOffMessages) => {
        /* istanbul ignore if */
        if (err) {
          logger.error('Redis len messages error: ' + err);
        }

        if (lenOffMessages > 0) {
          console.log(`start send ${lenOffMessages} off messages`);
          for (let i = 0; i <= Math.floor(lenOffMessages / 20); i++) {
            const start = 20 * i;
            const end = start + 19;

            client.lrange(
              socket.decoded.sn,
              start,
              end,
              (err, offMessagesData) => {
                /* istanbul ignore if */
                if (err) {
                  logger.error('Redis get old data error: ' + err);
                }

                for (let i = 0; i < offMessagesData.length; i++) {
                  io.to(socket.decoded.sn).emit('return-off-message', {
                    data: JSON.parse(offMessagesData[i])
                  });
                }
              }
            );
          }
        }
      });
    });
    console.log(
      'pub.hset(constants.NumToHostName',
      constants.NumToHostName,
      os.hostname()
    );
    pubSetNumToHostName.hset(
      constants.NumToHostName,
      socket.decoded.sn,
      os.hostname(),
      err => {
        /* istanbul ignore if */
        if (err) {
          logger.error(
            'Redis set NumToHostName error: ' +
              constants.NumToHostName +
              ' Number:' +
              socket.decoded +
              ' hostName:' +
              os.hostname()
          );
        }
      }
    );
    pubSetNumToHostName1.hset(
      constants.NumToHostName,
      socket.decoded.sn,
      os.hostname(),
      err => {
        /* istanbul ignore if */
        if (err) {
          logger.error(
            'Redis set NumToHostName error: ' +
              constants.NumToHostName +
              ' Number:' +
              socket.decoded +
              ' hostName:' +
              os.hostname()
          );
        }
      }
    );
    socket.join(socket.decoded.sn);
    socket.on('disconnect', () => {
      console.log(socket.decoded.sn + ' has disconnected.');
      global.ccu -= 1;
      client.srem(os.hostname(), socket.decoded.sn, err => {
        /* istanbul ignore if */
        if (err) {
          logger.error('Redis hostname error: ' + err);
        }
      });

      client.get(`${socket.decoded.sn}:off`, (err, num) => {
        /* istanbul ignore if */
        if (err) {
          return logger.error(
            'Redis get num confirm return off message error: ' + err
          );
        }

        /* istanbul ignore if */
        if (num) {
          client.ltrim(socket.decoded.sn, num, -1, err => {
            /* istanbul ignore if */
            if (err) {
              return logger.error(
                'Redis trim num return off message error: ' + err
              );
            }

            console.log(`Clear ${num} off messages`);

            client.del(`${socket.decoded.sn}:off`);
          });
        }
      });

      client.srem(constants.NumIsOnline, socket.decoded.sn, err => {
        /* istanbul ignore if */
        if (err) {
          logger.error('Redis NumIsOnline error: ' + err);
        }
      });
      socket.leave(socket.decoded.sn);
    });

    /*
    data: {
      recipient: { Number }
      body
    }
    */
    socket.on('create-conversation', data => {
      conversationController.newConversation(data, io, socket, pub);
    });

    /*
    data: {
      time
    }
    */
    socket.on('list-conversations', data => {
      conversationController.getListConversations(data, io, socket);
    });

    /*
    data: {
      conversationId
      body
      recipient: { Number }
    }
    */
    socket.on('send-message', data => {
      messageController.sendMessage(data, io, socket, pub);
    });

    /*
    data: {
      conversationId
      time
      participantsNumber
    }
    */
    socket.on('confirm-seen', data => {
      messageController.seenMessage(data, io, socket, pub);
    });

    /*
    data: {
      conversationId
      time
      participantsNumber
    }
    */
    // socket.on('get-messages', (data) => {
    //   messageController.getMessages(data, io, socket);
    // });

    /*
    data: {
      sn
    }
    */
    socket.on('add-contact', data => {
      userController.addContact(data, io, socket, pub);
    });

    /*
    data: {
      sn
    }
    */
    /* istanbul ignore next */
    socket.on('return-confirm-off-message', data => {
      messageController.confirmReturnOffMessage(data);
    });

    /*
    data: {
      v
    }
    */
    socket.on('get-version', data => {
      Version.checkVersion(data, io, socket);
    });

    /* istanbul ignore next */
    socket.on('error', error => {
      logger.error('Socket Error: ' + error);
    });

    /* istanbul ignore next */
    socket.on('connect_error', error => {
      logger.error('Socket Connect Error: ' + error);
    });
  });
};
