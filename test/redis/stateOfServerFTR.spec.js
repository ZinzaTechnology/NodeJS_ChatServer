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

describe('State of server in first time running', function() {
  this.timeout(30000);

  before(done => {
    client.del(config.keyRedis.sn);
    mongoose.connection.collections['users'].drop().catch(err => {console.log(err);});
    mongoose.connection.collections['messages'].drop().catch(err => {console.log(err);});
    done();
  });

  after(done => {
    client.del(config.keyRedis.sn);
    client.del(config.keyRedis.conversation);
    client.del(config.keyRedis.channelName);
    client.del(config.keyRedis.userId);
    client.del(config.keyRedis.messageId);
    client.del(config.keyRedis.cid);
    done();
  });

  it('Should have stateOfSever to be READY in the first time server running', done => {
    register.clear();
    app.default(config.port);
    setTimeout(() => {
      expect(global.stateOfServer).to.equal(READY);
      done();
    }, 20000);
  });
});
