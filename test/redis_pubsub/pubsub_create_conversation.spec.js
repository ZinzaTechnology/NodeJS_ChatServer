import chai from 'chai';
import server from '../../bin/server'; // eslint-disable-line
import io from 'socket.io-client';
import async from 'async';
import request from 'supertest';
import * as url from '../../app/constants/url';
import * as statusCode from '../../app/constants/statusCode';
import faker from 'faker';
var sleep = require('system-sleep');

const expect = chai.expect;
const agent = request.agent(url.hosttest);

describe('PUBSUB newConversation', function() {
  let user1, user2, options1, options2, data1, data2, client1, client2;

  before(done => {
    async.waterfall(
      [
        cb => {
          agent
            .post(url.v1 + url.auth + url.register)
            .send({ did: faker.random.alphaNumeric(20) })
            .expect(statusCode.CREATED, cb);
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
          options1 = {
            transports: ['websocket'],
            'force new connection': true,
            query: { token: user1.token }
          };
          options2 = {
            transports: ['websocket'],
            'force new connection': true,
            query: { token: user2.token }
          };
          data1 = {
            recipient: {
              sn: user2.user.sn
            },
            body: faker.random.words()
          };
        }
      ],
      done
    );
  });

  after(done => {
    client1.disconnect();
    client2.disconnect();
    done();
  });

  // Successfully created a new conversation
  it('pubsub to socket emit', done => {
    sleep(1000);
    client1 = io(url.hosttest, options1);

    client1.on('connect', () => {
      client1.on('create-conversation', data => {
        data2 = {
          cid: data.data.cid,
          body: 'Test pubsub message',
          recipient: { sn: user1.user.sn }
        };
        client2 = io(url.hosttest, options2);

        client2.on('connect', () => {
          client2.emit('send-message', data2);
        });
      });

      client1.on('return-message', data => {
        expect(data.data._id).to.exist;
        expect(data.data.cid).to.equal(data2.cid);
        expect(data.data.body).to.equal(data2.body);
        expect(data.data.au).to.equal(user2.user._id);
        expect(data.data.ausn).to.equal(user2.user.sn);
        done();
      });
      client1.emit('list-conversations', { time: '' });
      client1.emit('create-conversation', data1);
    });
  });
});
