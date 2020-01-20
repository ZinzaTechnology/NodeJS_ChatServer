import chai from 'chai';
import request from 'supertest';
import * as statusCode from '../../app/constants/statusCode';
import * as url from '../../app/constants/url';
import server from '../../bin/server'; // eslint-disable-line

const expect = chai.expect;
const agent = request.agent(url.hosttest);

//let client = new Redis({host: config.redis.host, port: config.redis.port});

describe('Check Metrics route', () => {
  it('Should return OK', done => {
    agent
      .get(url.v1 + url.metrics)
      .expect(statusCode.OK)
      .end(done);
  });
});
