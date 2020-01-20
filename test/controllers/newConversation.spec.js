import chai from 'chai';
import server from '../../bin/server'; // eslint-disable-line
import io from 'socket.io-client';
import async from 'async';
import request from 'supertest';
import * as url from '../../app/constants/url';
import * as statusCode from '../../app/constants/statusCode';
import * as statusMessage from '../../app/constants/statusMessage';
import faker from 'faker';

const expect = chai.expect;
const agent = request.agent(url.hosttest);

describe('Socket Event create-conversation', () => {
  let user1, user2, options, options2, data;

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
          cb(null, results);
          options = {
            transports: ['websocket'],
            'force new connection': true,
            query: { token: user1.token }
          };
          options2 = {
            transports: ['websocket'],
            'force new connection': true,
            query: { token: user2.token }
          };
          data = {
            recipient: {
              sn: ''
            },
            body: ''
          };
        }
      ],
      done
    );
  });

  // Successfully created a new conversation
  it('Should create a new conversation', done => {
    data.recipient.sn = user2.user.sn;
    data.body = 'Test create new conversation: message!!!';

    let client = io(url.hosttest, options);

    client.on('connect', () => {
      client.on('create-conversation', data => {
        expect(data.data.cid).to.exist;
        expect(data.data._id).to.exist;
        expect(data.data.status).to.equal(true);
        expect(data.data.body).to.equal(
          'Test create new conversation: message!!!'
        );
        expect(data.data.ausn).to.equal(user1.user.sn);
        expect(data.data.re).to.equal(user2.user.sn);
        client.disconnect();
        done();
      });
      client.emit('create-conversation', data);
    });
  });

  // Test should pass if can't create new conversation without recipient's Number
  it('Should not create a new conversation without recipient Number', done => {
    data.recipient.sn = '';
    data.body = faker.random.words();

    let client = io(url.hosttest, options);

    client.on('connect', () => {
      client.on('create-conversation', data => {
        expect(data.error).to.equal(statusMessage.chooseRecipient);
        client.disconnect();
        done();
      });
      client.emit('create-conversation', data);
    });
  });

  // Test should pass if can't create new conversation without body message
  it('Should not create a new conversation without body message', done => {
    data.recipient.sn = user2.user.sn;
    data.body = '';

    let client = io(url.hosttest, options);

    client.on('connect', () => {
      client.on('create-conversation', data => {
        expect(data.error).to.equal(statusMessage.missingMessage);
        client.disconnect();
        done();
      });
      client.emit('create-conversation', data);
    });
  });

  // Test should pass if cant create a new conversation with the body only contains spaces
  it('Should not create a new conversation with body only contains spaces', done => {
    data.recipient.sn = user2.user.sn;
    data.body = '              ';

    let client = io(url.hosttest, options);

    client.on('connect', () => {
      client.on('create-conversation', data => {
        expect(data.error).to.equal(statusMessage.missingMessage);
        client.disconnect();
        done();
      });
      client.emit('create-conversation', data);
    });
  });

  // Test should pass if cant create a new conversation with the body's too long
  it('Should not create a new conversation with a too long body', done => {
    data.recipient.sn = user2.user.sn;
    data.body = faker.random.alphaNumeric(5001);

    let client = io(url.hosttest, options);

    client.on('connect', () => {
      client.on('create-conversation', data => {
        expect(data.error).to.equal(statusMessage.messageTooLong);
        client.disconnect();
        done();
      });
      client.emit('create-conversation', data);
    });
  });

  // Test should pass if cant create a new conversation when another conversation between them has already created
  it('Should not create a new conversation if created', done => {
    data.recipient.sn = user1.user.sn;
    data.body = faker.random.words();

    let client = io(url.hosttest, options2);

    client.on('connect', () => {
      client.on('create-conversation', data => {
        expect(data.error).to.equal(statusMessage.conversationExisted);
        client.disconnect();
        done();
      });
      client.emit('create-conversation', data);
    });
  });

  // Test should pass if cant create a new conversation when Number iput is invalid
  it('Should not create a new conversation if Number iput is invalid', done => {
    data.recipient.sn = 1;
    data.body = 'Test create new conversation: message!!!';

    let client = io(url.hosttest, options);

    client.on('connect', () => {
      client.on('create-conversation', data => {
        expect(data.error).to.equal(statusMessage.notFoundUser);
        client.disconnect();
        done();
      });
      client.emit('create-conversation', data);
    });
  });
});
