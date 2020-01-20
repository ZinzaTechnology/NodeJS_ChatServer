import chai from 'chai';
import server from '../../bin/server'; // eslint-disable-line
import io from 'socket.io-client';
import async from 'async';
import request from 'supertest';
import * as url from '../../app/constants/url';
import * as statusCode from '../../app/constants/statusCode';
import * as statusMessage from '../../app/constants/statusMessage';
import * as global from '../../app/constants/global';
import faker from 'faker';

var sleep = require('system-sleep');

const expect = chai.expect;
const agent = request.agent(url.hosttest);

describe('Socket Event send-message', function() {
  let user1, user2, user3, options1, options2, data1, data2, cid;

  before(done => {
    async.waterfall(
      [
        cb => {
          setTimeout(() => {
            agent
              .post(url.v1 + url.auth + url.register)
              .send({ did: faker.random.alphaNumeric(20) })
              .expect(statusCode.CREATED, cb);
          }, 5000);
        },
        (results, cb) => {
          user1 = results.body;
          agent
            .post(url.v1 + url.auth + url.register)
            .send({ did: faker.random.alphaNumeric(20) })
            .expect(statusCode.CREATED, cb);
        },
        (results, cb) => {
          user2 = results.body;
          agent
            .post(url.v1 + url.auth + url.register)
            .send({ did: faker.random.alphaNumeric(20) })
            .expect(statusCode.CREATED, cb);
        },
        (results, cb) => {
          user3 = results.body;
          data1 = {
            recipient: {
              sn: user2.user.sn
            },
            body: 'Test create new conversation: message!!!'
          };
          options1 = {
            transports: ['websocket'],
            'force new connection': true,
            query: { token: user1.token }
          };
          options2 = {
            transports: ['websocket'],
            'force new connection': true,
            query: { token: user3.token }
          };

          cb(null, results);
        }
      ],
      done
    );
  });

  it('Should send message to conversation', done => {
    sleep(1000);
    let client = io(url.hosttest, options1);

    client.on('connect', () => {
      client.on('create-conversation', data => {
        cid = data.data.cid;
        data2 = {
          cid: data.data.cid,
          body: 'Test send message event.',
          recipient: { sn: user2.user.sn }
        };
        client.emit('send-message', data2);
      });

      client.on('send-message', data => {
        expect(data.data.body).to.equal(data2.body);
        client.disconnect();
        done();
      });

      client.emit('create-conversation', data1);
    });
  });

  // Test should pass if cant send message with empty body
  it('Should not send message to conversation with empty or only contain spaces body', done => {
    sleep(1000);
    let client = io(url.hosttest, options1);

    client.on('connect', () => {
      data2 = {
        cid: cid,
        body: '       ',
        recipient: { sn: user2.user.sn }
      };
      client.on('send-message', data => {
        expect(data.error).to.equal(statusMessage.missingMessage);
        client.disconnect();
        done();
      });
      client.emit('send-message', data2);
    });
  });

  // Test should pass if cant send message with too long body
  it('Should not send message to conversation with too long body', done => {
    sleep(1000);
    let client = io(url.hosttest, options1);

    client.on('connect', () => {
      data2 = {
        cid: cid,
        body: faker.random.alphaNumeric(global.maxLengthMessage + 1),
        recipient: { sn: user2.user.sn }
      };
      client.on('send-message', data => {
        expect(data.error).to.equal(statusMessage.messageTooLong);
        client.disconnect();
        done();
      });
      client.emit('send-message', data2);
    });
  });

  // Test should pass if cant send message to conversation which author is not in
  it('Should not send message to conversation which author is not in', done => {
    sleep(1000);
    let client = io(url.hosttest, options2);

    client.on('connect', () => {
      data2 = {
        cid: cid,
        body: faker.random.alphaNumeric(global.maxLengthMessage + 1),
        recipient: { sn: user2.user.sn }
      };
      client.on('send-message', data => {
        expect(data.error).to.equal(statusMessage.wrongConversation);
        client.disconnect();
        done();
      });
      client.emit('send-message', data2);
    });
  });

  // Validate data sent in by client
  it('Validate data sent in by client: lack of data', done => {
    sleep(1000);
    let client = io(url.hosttest, options1);

    client.on('connect', () => {
      client.on('send-message', data => {
        expect(data.error).to.equal(statusMessage.lackOfDataSentIn);
        client.disconnect();
        done();
      });
      client.emit('send-message');
    });
  });

  // Validate data sent in by client
  it('Validate data sent in by client: lack of data.conversationId', done => {
    sleep(1000);
    let client = io(url.hosttest, options1);

    client.on('connect', () => {
      data2 = {
        cid: '',
        body: faker.random.word(),
        recipient: { sn: user2.user.sn }
      };
      client.on('send-message', data => {
        expect(data.error).to.equal(statusMessage.lackOfDataSentIn);
        client.disconnect();
        done();
      });
      client.emit('send-message', data2);
    });
  });

  // Validate data sent in by client
  it('Validate data sent in by client: lack of data.body', done => {
    sleep(1000);
    let client = io(url.hosttest, options1);

    client.on('connect', () => {
      data2 = {
        cid: cid,
        body: '',
        recipient: { sn: user2.user.sn }
      };
      client.on('send-message', data => {
        expect(data.error).to.equal(statusMessage.lackOfDataSentIn);
        client.disconnect();
        done();
      });
      client.emit('send-message', data2);
    });
  });

  // Validate data sent in by client
  it('Validate data sent in by client: lack of data.recipient', done => {
    sleep(1000);
    let client = io(url.hosttest, options1);

    client.on('connect', () => {
      data2 = {
        cid: cid,
        body: faker.random.word(),
        recipient: ''
      };
      client.on('send-message', data => {
        expect(data.error).to.equal(statusMessage.lackOfDataSentIn);
        client.disconnect();
        done();
      });
      client.emit('send-message', data2);
    });
  });

  // Validate data sent in by client
  it('Validate data sent in by client: lack of data.recipient.sn', done => {
    sleep(1000);
    let client = io(url.hosttest, options1);

    client.on('connect', () => {
      data2 = {
        cid: cid,
        body: faker.random.word(),
        recipient: { sn: '' }
      };
      client.on('send-message', data => {
        expect(data.error).to.equal(statusMessage.lackOfDataSentIn);
        client.disconnect();
        done();
      });
      client.emit('send-message', data2);
    });
  });

  // Test should pass if cant send message with un-created conversation
  it('Should not send message to un-created conversation', done => {
    sleep(1000);
    let client = io(url.hosttest, options1);

    client.on('connect', () => {
      data2 = {
        cid: '123qweasdzxc456rtyfghvbn',
        body: faker.random.alphaNumeric(global.maxLengthMessage),
        recipient: { sn: user2.user.sn }
      };
      client.on('send-message', data => {
        expect(data.error).to.equal(statusMessage.uncreatedConversation);
        client.disconnect();
        done();
      });
      client.emit('send-message', data2);
    });
  });

  // Test case cant send message to conversation with writable = false is in api_reset_Number.spec.js
});
