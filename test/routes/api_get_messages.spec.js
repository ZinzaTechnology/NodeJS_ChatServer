import chai from 'chai';
import server from '../../bin/server'; // eslint-disable-line
import io from 'socket.io-client';
import async from 'async';
import request from 'supertest';
import * as url from '../../app/constants/url';
import * as statusCode from '../../app/constants/statusCode';
import faker from 'faker';
import * as global from '../../app/constants/global';

const expect = chai.expect;
const agent = request.agent(url.hosttest);

describe('API get old messages', function() {
  let user1, user2, options, data1, data2, cid, token;

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
          data1 = {
            recipient: {
              sn: user2.user.sn
            },
            body: 'Test create new conversation: message!!!'
          };
          data2 = {
            cid: '',
            body: faker.random.words(),
            recipient: {
              sn: user2.user.sn
            }
          };
          options = {
            transports: ['websocket'],
            'force new connection': true,
            query: { token: user1.token }
          };

          token = user1.token;

          cb(null, results);
        }
      ],
      done
    );
  });

  it('Get latest 20 messages of conversation', done => {
    let client = io(url.hosttest, options);

    client.on('connect', () => {
      client.on('create-conversation', data => {
        cid = data.data.cid;
        data2.cid = data.data.cid;

        for (let i = 0; i < 30; i++) {
          setTimeout(() => {
            client.emit('send-message', data2);
          }, 10);
        }

        setTimeout(() => {
          agent
            .get(
              `${url.v1}${url.messages}?cid=${cid}&participantsNumber=${user2.user.sn}`
            )
            .set('Authorization', 'Bearer ' + token)
            .expect(statusCode.OK)
            .end((err, res) => {
              expect(res.body.conversation.length).to.equal(
                global.paginateMessagesCount
              );
              client.disconnect();
              done();
            });
        }, 2000);
      });

      client.emit('create-conversation', data1);
    });
  });

  it('Should return status 404 when no token', done => {
    agent
      .get(url.v1 + url.messages)
      .set('Authorization', 'Bearer ')
      .expect(statusCode.UNAUTHORIZED)
      .end(done);
  });

  it('Should return status 400 when no data', done => {
    agent
      .get(url.v1 + url.messages)
      .set('Authorization', 'Bearer ' + token)
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });

  it('Should return 400 when not exist cid', done => {
    agent
      .get(
        `${url.v1}${url.messages}?cid=11111&participantsNumber=${user2.user.sn}`
      )
      .set('Authorization', 'Bearer ' + token)
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });

  it('Should return 400 when not exit sn', done => {
    agent
      .get(`${url.v1}${url.messages}?cid=${cid}&participantsNumber=1111`)
      .set('Authorization', 'Bearer ' + token)
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });
});
