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

describe('Socket Event list-conversations', () => {
  let user1,
    user2,
    user3,
    options1,
    options2,
    data1,
    data2,
    g_resultData2,
    data13;

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
              sn: user3.user.sn
            },
            body: faker.random.words()
          };
          data2 = {
            recipient: {
              sn: user2.user.sn
            },
            body: faker.random.words()
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

  // Have no change so response data should have nothing in conversations array
  it('Should get an empty conversations array', done => {
    let client = io(url.hosttest, options2);

    client.on('connect', () => {
      client.on('list-conversations', data => {
        expect(data.conversations.length).to.equal(0);
        expect(data.time).to.be.exist;
        client.disconnect();
        done();
      });

      let data = { time: new Date(Date.now()) };
      client.emit('list-conversations', data);
    });
  });

  // Validate if do not have data sent in by client
  it('Validate if do not have data sent in by client', done => {
    let client = io(url.hosttest, options2);

    client.on('connect', () => {
      client.on('list-conversations', data => {
        expect(data.error).to.equal(statusMessage.lackOfDataSentIn);
        client.disconnect();
        done();
      });

      client.emit('list-conversations');
    });
  });

  it('Should get list conversations', done => {
    /*
    create conversation: user1 -> user3
    create conversation: user3 -> user2
    get list conversations of user3
    expect to sort by time
    */
    // connect user1
    let client1 = io(url.hosttest, options1);

    client1.on('connect', () => {
      client1.on('create-conversation', () => {
        // connect user3
        let client2 = io(url.hosttest, options2);

        client2.on('connect', () => {
          client2.on('create-conversation', resultData2 => {
            g_resultData2 = resultData2;
            // get list conversation
            let data = { time: '' };
            setTimeout(() => {
              client2.emit('list-conversations', data);
            }, 1000);

            setTimeout(() => {
              client2.on('list-conversations', data => {
                expect(data.time).to.be.exist;
                expect(data.conversations[0].par[0]._id).to.not.equal(
                  user3.user._id
                );
                expect(data.conversations[1].par[0]._id).to.not.equal(
                  user3.user._id
                );
                expect(data.conversations.length).to.equal(2);
                expect(
                  data.conversations[0].updatedAt >
                    data.conversations[1].updatedAt
                ).to.be.true;
                client2.disconnect();
                done();
              });
            }, 1000);
          });

          // create conversation 3-> 2
          client2.emit('create-conversation', data2);
        });

        client1.disconnect();
      });
      // create conversation 1 -> 3
      client1.emit('create-conversation', data1);
    });
  });

  it('should get last message after send message ', done => {
    data13 = {
      cid: g_resultData2.data.cid,
      body: 'Test send message event.',
      recipient: { sn: user2.user.sn }
    };
    let client2 = io(url.hosttest, options2);

    client2.on('connect', () => {
      client2.on('send-message', () => {
        client2.on('list-conversations', data => {
          expect(data.conversations[0].lm.body).to.equal(data13.body);
          client2.disconnect();
          done();
        });

        client2.emit('list-conversations', { time: '' });
      });

      client2.emit('send-message', data13);
    });
  });
});
