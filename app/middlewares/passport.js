import passport from 'passport';
import LocalStrategy from 'passport-local';
import User from '../models/user';
import * as message from '../constants/statusMessage';
import passportJwt from 'passport-jwt';
import config from '../../config/main';

const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

const localOptions = {
  usernameField: 'sn',
  passwordField: 'token'
};

const jwtOptions = {
  // Telling Passport to check authorization headers for JWT
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  // Telling Passport where to find the secret
  secretOrKey: config.secret
};

// Set up local login strategy
/* istanbul ignore next */
const localLogin = new LocalStrategy(localOptions, function(sn, token, done) {
  User.findOne({ sn: sn }, (err, user) => {
    /* istanbul ignore if */
    if (err) return done(err);
    if (!user) {
      return done(null, false, { error: message.passportError });
    }

    user.compareToken(token, (err, isMatch) => {
      /* istanbul ignore if */
      if (err) return done(err);
      if (!isMatch) {
        return done(null, false, { error: message.passportError });
      }
      return done(null, user);
    });
  });
});

// Setting up JWT login strategy
const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {
  User.findById(payload._id, function(err, user) {
    /* istanbul ignore next */
    if (err) {
      return done(err, false);
    }
    /* istanbul ignore next */
    if (user) {
      done(null, user);
    } /* istanbul ignore next */ else {
      done(null, false);
    }
  });
});

passport.use(localLogin);
passport.use(jwtLogin);
