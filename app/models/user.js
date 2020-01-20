import mongoose from 'mongoose';
import bcrypt from 'bcrypt-nodejs';

const Schema = mongoose.Schema;

// ===========================
// User Schema
// ===========================
const UserSchema = new Schema({
  // abridged code
},
{
  timestamps: true
});

/* istanbul ignore next */
// Pre-save to the database, hash the token
UserSchema.pre('save', function (next) {
  const SALT_FACTOR = 5;
  /* istanbul ignore if */
  if (!this.isModified('token')) return next();

  bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
    /* istanbul ignore if */
    if (err) return next(err);

    bcrypt.hash(this.token, salt, null, (err, hash) => {
      /* istanbul ignore if */
      if (err) return next(err);
      this.token = hash;
      next();
    });
  });
});

UserSchema.methods.encryptToken = function (cb) {
  const SALT_FACTOR = 5;
  bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
    /* istanbul ignore if */
    if (err) {
      cb(err);
    }

    bcrypt.hash(this.token, salt, null, (err, hash) => {
      /* istanbul ignore if */
      if (err) {
        return cb(err);
      }
      this.token = hash;
      cb(null, hash);
    });
  });
};

// Method to compare token for login
UserSchema.methods.compareToken = function (candidateToken, cb) {
  bcrypt.compare(candidateToken, this.token, (err, isMatch) => {
    /* istanbul ignore if */
    if (err) {
      return cb(err);
    }

    cb(null, isMatch);
  });
};

export default mongoose.model('User', UserSchema);
