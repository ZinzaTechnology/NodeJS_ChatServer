import * as statusCode from '../constants/statusCode';
import { READY } from '../constants/global';

/* istanbul ignore next */
export function readiness(req, res) {
  if (global.stateOfServer === READY) {
    return res.status(statusCode.OK).end();
  } else {
    return res.status(statusCode.SERVICE_UNAVAILABLE).end();
  }
}

/* istanbul ignore next */
export function liveness(req, res, next) {
  res.status(statusCode.OK).end();
  next();
}
