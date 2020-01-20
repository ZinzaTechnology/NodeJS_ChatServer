import chai from 'chai';
import server from '../../bin/server'; // eslint-disable-line
import request from 'supertest';
import * as statusCode from '../../app/constants/statusCode';
import * as url from '../../app/constants/url';
import async from 'async';
import faker from 'faker';

var sleep = require('system-sleep');
const expect = chai.expect;
const agent = request.agent(url.hosttest);

describe('Update user info', () => {
  let token;
  let deviceid = faker.random.alphaNumeric(20);
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
          cb(null, results);
        }
      ],
      done
    );
  });

  it('Update user info', done => {
    sleep(1000);
    async.waterfall(
      [
        cb => {
          agent
            .put(url.v1 + url.user)
            .set('Authorization', 'Bearer ' + token)
            .set('deviceid', deviceid)
            .type('form')
            .send({ name: 'SampleMessage' })
            .expect(statusCode.OK, cb);
        },
        (results, cb) => {
          expect(results.body.Info.name).to.equal('SampleMessage');
          cb(null, results);
        }
      ],
      done
    );
  });

  it('Can not update user info without token', done => {
    sleep(1000);
    agent
      .put(url.v1 + url.user)
      .send({ name: 'SampleMessage' })
      .type('form')
      .expect(statusCode.UNAUTHORIZED)
      .end(done);
  });

  it('Can not update user info with length > 32', done => {
    sleep(1000);
    agent
      .put(url.v1 + url.user)
      .set('Authorization', 'Bearer ' + token)
      .set('x-localization', 'en')
      .set('deviceid', deviceid)
      .type('form')
      .send({ name: faker.random.alphaNumeric(33) })
      .expect(statusCode.UNPROCESSABLE_ENTITY)
      .end((err, res) => {
        expect(err).to.not.exist;
        expect(JSON.parse(res.text).error).to.equal('Your name is too long!!!');
        done();
      });
  });

  it('can not update user with user name invalid', done => {
    sleep(1000);
    agent
      .put(url.v1 + url.user)
      .set('Authorization', 'Bearer ' + token)
      .set('deviceid', deviceid)
      .type('form')
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });
});
