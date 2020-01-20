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

describe('Delete Number', function() {
  let token;
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
          token = results.body.token;
          cb(null, results);
        }
      ],
      done
    );
  });

  it('Return 401 with no token', done => {
    sleep(1000);
    agent
      .delete(url.v1 + url.user + url.deleteSN)
      .expect(statusCode.UNAUTHORIZED)
      .end(done);
  });

  it('Delete user success', done => {
    sleep(1000);
    agent
      .delete(url.v1 + url.user + url.deleteSN)
      .set('Authorization', 'Bearer ' + token)
      .expect(statusCode.OK)
      .end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body).to.have.any.keys('Info');
        expect(res.body.Info).to.equal('Delete Number Success');
        done();
      });
  });
});
