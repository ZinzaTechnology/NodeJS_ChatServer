import chai from 'chai';
import server from '../../bin/server'; // eslint-disable-line
import async from 'async';
import request from 'supertest';
import * as url from '../../app/constants/url';
import * as statusCode from '../../app/constants/statusCode';
import faker from 'faker';

var sleep = require('system-sleep');

const expect = chai.expect;
const agent = request.agent(server);

describe('api load config', function() {
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

  it('Invalid token', done => {
    sleep(1000);
    agent
      .get(url.v1 + url.config)
      .set('Authorization', 'Bearer token')
      .expect(statusCode.UNAUTHORIZED)
      .end(done);
  });

  it('Set device token ok', done => {
    sleep(1000);
    agent
      .get(url.v1 + url.config)
      .set('Authorization', 'Bearer ' + token)
      .expect(statusCode.OK)
      .end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.any.keys('data');
        expect(res.body.data).to.be.an('object');
        expect(res.body.data).to.have.any.keys('en');
        expect(res.body.data).to.have.any.keys('ja');
        done();
      });
  });
});
