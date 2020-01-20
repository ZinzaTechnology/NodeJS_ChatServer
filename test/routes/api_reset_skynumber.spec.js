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

describe('Reset Number', function() {
  let token, sender;
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
          sender = results.body.user;
          cb(null, results);
        }
      ],
      done
    );
  });

  it('Return new Number, _id and token', done => {
    sleep(1000);
    agent
      .put(url.v1 + url.user + url.reset)
      .set('Authorization', 'Bearer ' + token)
      .expect(statusCode.CREATED)
      .end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.token).to.not.equal(token);
        expect(res.body.user._id).to.not.equal(sender._id);
        expect(res.body.user.sn).to.not.equal(sender.sn);
        done();
      });
  });

  it('Can not reset Number without Authentication', done => {
    sleep(1000);
    agent
      .put(url.v1 + url.user + url.reset)
      .expect(statusCode.UNAUTHORIZED)
      .end(done);
  });
});
