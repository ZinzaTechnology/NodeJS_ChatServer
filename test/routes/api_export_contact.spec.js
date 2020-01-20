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

describe('api export contact', function() {
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

  it('failed with wrong token', done => {
    agent
      .post(url.v1 + url.contact + url.exportCT)
      .set('Authorization', 'Bearer token')
      .expect(statusCode.UNAUTHORIZED)
      .end(done);
  });

  it('Failed with invalid params', done => {
    sleep(1000);
    agent
      .post(url.v1 + url.contact + url.exportCT)
      .set('Authorization', 'Bearer ' + token)
      .send({ email: '' })
      .send({ data: '' })
      .type('form')
      .expect(statusCode.BAD_REQUEST)
      .end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body).to.have.any.keys('error');
        expect(res.body.error).to.equal(
          'Invalid parameter , please check again'
        );
        done();
      });
  });

  it('send email success', done => {
    sleep(1000);
    agent
      .post(url.v1 + url.contact + url.exportCT)
      .set('Authorization', 'Bearer ' + token)
      .send({ email: 'quan@zinza.com.vn' })
      .send({
        data:
          '{"0":{"Number": "99121223", "profileName": "test 04 05", "memo": ""}}'
      })
      .type('form')
      .expect(statusCode.OK)
      .end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body).to.have.any.keys('Info');
        expect(res.body.Info).to.equal('Contact is send to your email');
        done();
      });
  });
});
