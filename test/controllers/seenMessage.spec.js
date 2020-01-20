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

describe('Socket Event confirm-seen', function() {
  let user1, user2, options1, options2, data1, data2;

  beforeEach(done => {
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
            query: { token: user2.token }
          };

          cb(null, results);
        }
      ],
      done
    );
  });

  it('Validate data had been sent by client: lack of data', done => {
    let client1 = io(url.hosttest, options1);

    client1.on('connect', () => {
      client1.on('create-conversation', data => {
        data2 = {
          cid: data.data.cid,
          body: 'Test send message event.',
          recipient: { sn: user1.user.sn }
        };
        client1.disconnect();

        let client2 = io(url.hosttest, options2);

        client2.on('connect', () => {
          client2.on('send-message', () => {
            let data3 = {};
            client2.emit('confirm-seen', data3);
          });
          client2.on('confirm-seen', data => {
            expect(data.error).to.equal(statusMessage.lackOfDataSentIn);
            client2.disconnect();
            done();
          });

          client2.emit('send-message', data2);
        });
      });

      client1.emit('create-conversation', data1);
    });
  });

  it('Should not change status of your message by yourself', done => {
    let client1 = io(url.hosttest, options1);

    client1.on('connect', () => {
      client1.on('create-conversation', data => {
        data2 = {
          cid: data.data.cid,
          body: 'Test send message event.',
          recipient: { sn: user1.user.sn }
        };
        client1.disconnect();

        let client2 = io(url.hosttest, options2);

        client2.on('connect', () => {
          client2.on('send-message', () => {
            let data3 = {
              cid: data.data.cid,
              time: data.data.sa,
              participantsNumber: user2.user.sn,
              messageId: data.data._id
            };

            client2.on('confirm-seen', data => {
              expect(data.error).to.equal(statusMessage.wrongInputData);
              client2.disconnect();
              done();
            });

            client2.emit('confirm-seen', data3);
          });

          client2.emit('send-message', data2);
        });
      });

      client1.emit('create-conversation', data1);
    });
  });

  it('Should not change seenstatus if conversationId is not existed', done => {
    let client1 = io(url.hosttest, options1);

    client1.on('connect', () => {
      client1.on('create-conversation', data => {
        data2 = {
          cid: data.data.cid,
          body: 'Test send message event.',
          recipient: { sn: user1.user.sn }
        };
        let testData = {
          cid: data.data.cid,
          body: 'user1 to user2.',
          recipient: { sn: user2.user.sn }
        };

        client1.emit('send-message', testData);

        let client2 = io(url.hosttest, options2);

        client2.on('connect', () => {
          client2.on('send-message', data => {
            let data3 = {
              cid: '111111111111111',
              time: data.data.sa,
              participantsNumber: user1.user.sn,
              messageId: data.data._id
            };

            client2.on('confirm-seen', data => {
              expect(data.error).to.equal(statusMessage.wrongInputData);
              client2.disconnect();
              done();
            });

            client2.emit('confirm-seen', data3);
          });

          client2.emit('send-message', data2);
        });
      });

      client1.emit('create-conversation', data1);
    });
  });

  it('Should change status of messages', done => {
    let client1 = io(url.hosttest, options1);
    let client2;

    client1.on('connect', () => {
      client1.on('return-confirm-seen', data => {
        expect(data.data).to.exist;
        client1.disconnect();
        client2.disconnect();
        done();
      });

      client1.on('create-conversation', data => {
        data2 = {
          cid: data.data.cid,
          body: 'Test send message event.',
          recipient: { sn: user1.user.sn }
        };
        let testData = {
          cid: data.data.cid,
          body: 'user1 to user2.',
          recipient: { sn: user2.user.sn }
        };

        client2 = io(url.hosttest, options2);

        client2.on('connect', () => {
          client2.on('return-message', data => {
            let data3 = {
              cid: data.data.cid,
              time: data.data.sa,
              participantsNumber: user1.user.sn,
              messageId: data.data._id
            };
            setTimeout(() => {
              client2.emit('confirm-seen', data3);
            }, 1000);
          });
          client1.emit('send-message', testData);
        });
      });
      client1.emit('create-conversation', data1);
    });
  });
});
