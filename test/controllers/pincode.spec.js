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

describe('Confirm pincode features', function() {
  let token;
  let did = faker.random.alphaNumeric(20);
  let sn;
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
          sn = results.body.user.sn;
          cb(null, results);
        }
      ],
      done
    );
  });

  it('Can not create pincode with wrong token', done => {
    sleep(1000);
    agent
      .put(url.v1 + url.user + url.PinCode)
      .set('Authorization', 'Bearer ' + 'tokenxxxxx')
      .send('did', did)
      .send({ name: 'SampleMessage' })
      .type('form')
      .expect(statusCode.UNAUTHORIZED)
      .end(done);
  });

  it('Can not create pincode with wrong over length 4 character', done => {
    sleep(1000);
    agent
      .put(url.v1 + url.user + url.PinCode)
      .set('Authorization', 'Bearer ' + token)
      .send('did', did)
      .send({ pincode: '345344545' })
      .send({ sn: sn })
      .type('form')
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });

  it('Pincode is not exist', done => {
    sleep(1000);
    agent
      .post(url.v1 + url.user + url.PinCode)
      .send({ did: did })
      .send({ pincode: '3453' })
      .send({ sn: sn })
      .type('form')
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });

  it('Can create pincode', done => {
    sleep(1000);
    agent
      .put(url.v1 + url.user + url.PinCode)
      .set('Authorization', 'Bearer ' + token)
      .set('did', did)
      .send({ pincode: '9999' })
      .send({ sn: sn })
      .type('form')
      .expect(statusCode.CREATED)
      .end(done);
  });

  it('Sample number is invalid', done => {
    agent
      .post(url.v1 + url.user + url.PinCode)
      .send({ sn: '' })
      .send({ did: did })
      .send({ pincode: '9999' })
      .type('form')
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });

  it('DevideId is invalid', done => {
    sleep(1000);
    agent
      .post(url.v1 + url.user + url.PinCode)
      .send({ sn: sn })
      .send({ did: '' })
      .send({ pincode: '9999' })
      .type('form')
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });

  it('Pincode is invalid', done => {
    sleep(1000);
    agent
      .post(url.v1 + url.user + url.PinCode)
      .send({ sn: sn })
      .send({ did: did })
      .send({ pincode: '' })
      .type('form')
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });

  it('User not found', done => {
    sleep(1000);
    agent
      .post(url.v1 + url.user + url.PinCode)
      .send({ sn: '01234567' })
      .send({ did: did })
      .send({ pincode: '9999' })
      .type('form')
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });

  it('Pincode is not match', done => {
    sleep(1000);
    agent
      .post(url.v1 + url.user + url.PinCode)
      .send({ sn: sn })
      .send({ did: did })
      .send({ pincode: '9998' })
      .type('form')
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });

  it('Pincode matching', done => {
    sleep(1000);
    agent
      .post(url.v1 + url.user + url.PinCode)
      .send({ sn: sn })
      .send({ did: did })
      .send({ pincode: '9999' })
      .type('form')
      .expect(statusCode.OK)
      .end((err, res) => {
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.any.keys('token', 'user');
        expect(res.body.user).to.have.any.keys('_id', 'did', 'sn');
        expect(res.body.user.did).to.equal(`${did}`);
        expect(res.body.user.sn).to.equal(`${sn}`);
        done();
      });
  });
});
