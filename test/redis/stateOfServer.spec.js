import chai from 'chai';
import server from '../../bin/server'; // eslint-disable-line no-unused-vars
import config from '../../config/main';
import Redis from 'ioredis';
import { READY, NOT_READY } from '../../app/constants/global';
import mongoose from 'mongoose';

const register = require('prom-client').register;

let app = require('../../app/index');
mongoose.connect(config.database);

const expect = chai.expect;
let client = new Redis({host: config.redis.host, port: config.redis.port});

describe('State of Server check', function() {
  before(done => {
    client.del(config.keyRedis.sn, () => {
      done();
    });
  });

  after(done => {
    mongoose.connection.db.dropCollection('conversations', (err) => {
      register.clear();
      expect(err).to.not.exist;
      done();
    });
  });

  it('Should change the state of server', (done) => {
    register.clear();
    app.default(config.port);

    setTimeout(() => {
      expect(global.stateOfServer).to.equal(NOT_READY);
    }, 100);

    setTimeout(() => {
      expect(global.stateOfServer).to.equal(READY);
      done();
    }, 15000);
  });

  it('Should have stateOfServer to be READY', done => {
    register.clear();
    app.default(config.port);
    setTimeout(() => {
      expect(global.stateOfServer).to.equal(READY);
    }, 10000);
    done();
  });
});
