import chai from 'chai';
import server from '../../bin/server'; // eslint-disable-line
import request from 'supertest';
import * as statusCode from '../../app/constants/statusCode';
import * as url from '../../app/constants/url';
import faker from 'faker';

const expect = chai.expect;
const agent = request.agent(url.hosttest);

describe('Register New User', () => {
  it('Should save a User to the database', done => {
    agent
      .post(url.v1 + url.auth + url.register)
      .send({ did: faker.random.alphaNumeric(20) })
      .expect(statusCode.CREATED)
      .end((err, res) => {
        expect(err).to.not.exist;
        let userInfo = JSON.parse(res.text);
        expect(userInfo.user.sn).to.exist;
        expect(userInfo.user._id).to.exist;
        expect(userInfo.token).to.exist;
        done();
      });
  });

  it('Invalid request params', done => {
    agent
      .post(url.v1 + url.auth + url.register)
      .send({ did: '' })
      .expect(statusCode.BAD_REQUEST)
      .end(done);
  });
});
