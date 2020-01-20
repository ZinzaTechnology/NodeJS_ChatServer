import chai from 'chai';
import server from '../../bin/server'; // eslint-disable-line
import request from 'supertest';
import * as statusCode from '../../app/constants/statusCode';
//import * as statusMessage from '../../app/constants/statusMessage';
import * as url from '../../app/constants/url';
import async from 'async';
//import io from 'socket.io-client';
import faker from 'faker';

var sleep = require('system-sleep');

const expect = chai.expect;
const agent = request.agent(server);

describe('User info', function() {
  let token, user0;
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
          token = results.body.token;
          user0 = results.body.user;
          sleep(1000);
          cb(null, results);
        }
      ],
      done
    );
  });

  it('User does not login', done => {
    agent
      .get(url.v1 + url.user + '/' + user0.sn)
      .set('Authorization', 'Bearer ')
      .expect(statusCode.UNAUTHORIZED)
      .end(done);
  });

  it('Return user Info', done => {
    agent
      .get(url.v1 + url.user + '/' + user0.sn)
      .set('Authorization', 'Bearer ' + token)
      .expect(statusCode.OK)
      .end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.sn).to.equal(user0.sn);
        done();
      });
  });

  it('User is undefined', done => {
    sleep(1000);
    agent
      .get(url.v1 + url.user + '/12345678')
      .set('Authorization', 'Bearer ' + token)
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });
});
