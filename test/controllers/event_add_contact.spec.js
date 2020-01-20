import chai from 'chai';
import server from '../../bin/server'; // eslint-disable-line
import io from 'socket.io-client';
import async from 'async';
import request from 'supertest';
import * as url from '../../app/constants/url';
import * as statusCode from '../../app/constants/statusCode';
import faker from 'faker';

const expect = chai.expect;
const agent = request.agent(server);

describe('Socket Event add-contact', function() {
  let user1, user2, options, data;

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

          data = {
            sn: ''
          };
        }
      ],
      done
    );
  });

  it('Should add new contact', done => {
    data.sn = user2.user.sn;

    let client = io(url.hosttest, options);

    client.on('connect', () => {
      client.on('add-contact', data => {
        expect(data.sn).to.equal(user2.user.sn);
        client.disconnect();
      });
      client.emit('add-contact', data);
    });

    done();
  });
});
