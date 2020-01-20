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
const agent = request.agent(server);

describe('api check online', function() {
  let token1, sn2, sn3, options;

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
          token1 = results.body.token;

          agent
            .post(url.v1 + url.auth + url.register)
            .send({ did: faker.random.alphaNumeric(20) })
            .expect(statusCode.CREATED, cb);
        },
        (results, cb) => {
          sn2 = results.body.user.sn;

          agent
            .post(url.v1 + url.auth + url.register)
            .send({ did: faker.random.alphaNumeric(20) })
            .expect(statusCode.CREATED, cb);
        },
        (results, cb) => {
          sn3 = results.body.user.sn;

          options = {
            transports: ['websocket'],
            'force new connection': true,
            query: { token: results.body.token }
          };

          cb(null, results);
        }
      ],
      done
    );
  });

  it('failed with unauthorized', done => {
    sleep(1000);
    agent
      .post(url.v1 + url.contact + url.online)
      .expect(statusCode.UNAUTHORIZED)
      .end(done);
  });

  it('failed with invalid data', done => {
    sleep(1000);
    agent
      .post(url.v1 + url.contact + url.online)
      .set('Authorization', 'Bearer ' + token1)
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });

  it('return list online offline', done => {
    sleep(1000);
    let client = io(url.hosttest, options);
    let data = [sn2, sn3];
    client.on('connect', () => {
      agent
        .post(url.v1 + url.contact + url.online)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token1)
        .send({ data: data })
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.data.length).to.equal(2);
          expect(res.body.data[0].sn).to.equal(sn2);
          expect(res.body.data[0].isOnline).to.equal(false);
          expect(res.body.data[1].sn).to.equal(sn3);
          expect(res.body.data[1].isOnline).to.equal(true);
          client.disconnect();
          done();
        });
    });
  });
});
