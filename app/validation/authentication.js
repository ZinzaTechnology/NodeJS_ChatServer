import fetch from 'isomorphic-fetch';
import * as Language from '../middlewares/language';
import * as statusCode from '../constants/statusCode';
import config from '../../config/main';
import logger from '../../config/winston';

export function validateRegisterBody(req, res, next) {
  const { did } = req.body;

  if (did === '' || did === undefined) {
    return Language.getData(req, 'INVALID_PARAM').then(data => {
      res.status(statusCode.BAD_REQUEST).json({ error: data });
    });
  }

  next();
}

/* istanbul ignore next */
export function validateRecaptcha(req, res, next) {
  if (config.env === 'production' || config.env === 'stagging') {
    const { captcha } = req.body;

    if (!captcha || captcha === undefined) {
      return Language.getData(req, 'INVALID_PARAM').then(data => {
        res.status(statusCode.BAD_REQUEST).json({ error: data });
      });
    }

    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${config.captcha.secretKey}&response=${captcha}`;

    fetch(url, {
      method: 'post'
    })
      .then(response => response.json())
      .then(gooleResponse => {
        if (gooleResponse.success === false || gooleResponse.score <= 0.1) {
          logger.error('Request is the same boot');
          return Language.getData(req, 'DUPLICATE_SPAM').then(data => {
            res.status(statusCode.BAD_REQUEST).json({ error: data });
          });
        }

        next();
      })
      .catch(error => {
        logger.error('validate Recaptcha Catch err', error);
        return Language.getData(req, 'UNKNOW_ERROR').then(data => {
          res.status(statusCode.BAD_REQUEST).json({ error: data });
        });
      });
  } else {
    next();
  }
}
