import chai from 'chai';
import mongoose from 'mongoose';

const expect = chai.expect;

describe('Database connection', () => {
  let database;
  before(() => {
    database = '';
  });
  it('Should throw err if can not connect to the database', (done) => {
    mongoose.connect(database);
    expect(mongoose.connection.readyState).to.equal(0);
    done();
  });
});