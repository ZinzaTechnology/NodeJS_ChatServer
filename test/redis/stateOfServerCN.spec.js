import chai from 'chai';
import server from '../../bin/server'; // eslint-disable-line no-unused-vars
import config from '../../config/main';
import Redis from 'ioredis';
import { READY } from '../../app/constants/global';
import mongoose from 'mongoose';

const register = require('prom-client').register;

let app = require('../../app/index');
mongoose.connect(config.database);

const expect = chai.expect;
let client = new Redis({host: config.redis.host, port: config.redis.port});

describe('State of server: conversation-none', function() {
  this.timeout(100000);

  before(done => {
    client.del(config.keyRedis.sn, (err) => {
      expect(err).to.not.exist;
      done();
    });
  });

  it('Should have stateOfServer to be READY when there are no conversation', done => {
    register.clear();
    app.default(config.port);

    setTimeout(() => {
      expect(global.stateOfServer).to.equal(READY);
      done();
    }, 10000);
  });
});
