import jwt from 'jsonwebtoken';
import Admin from '../models/admin';
import * as statusCode from '../constants/statusCode';
import config from '../../config/main';

/* istanbul ignore next */
export function requireAdmin(req, res, next) {
  const bearerToken = req.header('Authorization');

  if (!bearerToken) {
    return res.status(statusCode.UNAUTHORIZED).json({
      error: 'UnAuthorization'
    });
  }

  const token = bearerToken.replace('Bearer ', '');

  const decoded = jwt.decode(token, config.secret);

  Admin.findById(decoded.id)
    .select('-password')
    .then(admin => {
      req.user = admin;
      next();
    })
    .catch(err => {
      console.log(err);
      return res.status(statusCode.UNAUTHORIZED).json({
        error: 'UnAuthorization'
      });
    });
}
