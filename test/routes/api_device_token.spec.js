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

describe('api device token', function() {
  let sn, token;

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
          sn = results.body.user.sn;
          token = results.body.token;
          cb(null, results);
        }
      ],
      done
    );
  });

  it('Set device token failed with wrong token', done => {
    agent
      .put(url.v1 + url.user + url.deviceToken)
      .set('Authorization', 'Bearer token')
      .send({ sn: sn })
      .send({ deviceToken: token })
      .type('form')
      .expect(statusCode.UNAUTHORIZED)
      .end(done);
  });

  it('invalid params', done => {
    sleep(1000);
    agent
      .put(url.v1 + url.user + url.deviceToken)
      .set('Authorization', 'Bearer ' + token)
      .expect(statusCode.BAD_REQUEST)
      .end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.any.keys('error');
        done();
      });
  });

  it('Set device token ok', done => {
    sleep(1000);
    agent
      .put(url.v1 + url.user + url.deviceToken)
      .set('Authorization', 'Bearer ' + token)
      .send({ sn: sn })
      .send({ deviceToken: token })
      .type('form')
      .expect(statusCode.OK)
      .end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.any.keys('Info');
        expect(res.body.Info).to.equal('Set device token ok');
        done();
      });
  });
});
