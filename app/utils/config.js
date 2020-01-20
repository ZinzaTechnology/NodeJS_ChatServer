import * as statusCode from '../constants/statusCode';
import * as Language from '../middlewares/language';
import * as constants from '../constants/global';
import { client } from '../index';
import logger from '../../config/winston';
import config from '../../config/main';

export function getConfig(req, res) {
  let req1 = {
    headers: {
      'x-localization': 'en'
    }
  };

  let req2 = {
    headers: {
      'x-localization': 'ja'
    }
  };

  Promise.all([
    Language.getData(req1, 'ADD_CONTACT_TITLE'),
    Language.getData(req1, 'ADD_CONTACT_CONTENT'),
    Language.getData(req1, 'INVITE_FRIEND'),
    Language.getData(req1, 'TRANSFER_CONTENT'),
    Language.getData(req1, 'LINK'),
    Language.getData(req1, 'TRANSFER_TITLE'),
    Language.getData(req2, 'ADD_CONTACT_TITLE'),
    Language.getData(req2, 'ADD_CONTACT_CONTENT'),
    Language.getData(req2, 'INVITE_FRIEND'),
    Language.getData(req2, 'TRANSFER_CONTENT'),
    Language.getData(req2, 'LINK'),
    Language.getData(req2, 'TRANSFER_TITLE')
  ])
    .then(config => {
      let data = {
        en: {
          appStoreUrl: constants.appStoreUrl,
          ADD_CONTACT_TITLE: config[0],
          ADD_CONTACT_CONTENT: config[1],
          INVITE_FRIEND: config[2],
          TRANSFER_CONTENT: config[3],
          LINK: config[4],
          TRANSFER_TITLE: config[5]
        },
        ja: {
          appStoreUrl: constants.appStoreUrl,
          ADD_CONTACT_TITLE: config[6],
          ADD_CONTACT_CONTENT: config[7],
          INVITE_FRIEND: config[8],
          TRANSFER_CONTENT: config[9],
          LINK: config[10],
          TRANSFER_TITLE: config[11]
        }
      };

      console.log(`load config: ${JSON.stringify(data)}`);

      res.status(statusCode.OK).json({ data });
    })
    .catch(err => {
      console.log(`Get config data err: ${err}`);
      return Language.getData(req, 'UNKNOW_ERROR').then(data => {
        res.status(statusCode.BAD_REQUEST).json({ error: data });
      });
    });
}

/* istanbul ignore next */
export function updateVersion(req, res) {
  if (config.env === 'development') {
    const { v, b } = req.body;

    if (!v || v == '' || !b || b == '') {
      return Language.getData(req, 'INVALID_PARAM').then(data => {
        res.status(statusCode.BAD_REQUEST).json({ error: data });
      });
    }

    const newVersion = {
      v,
      b
    };

    client.set('version', JSON.stringify(newVersion), (err, done) => {
      /* istanbul ignore if */
      if (err) {
        return logger.error('Redis update version error', err);
      }

      console.log('new version: ', done);

      res.status(statusCode.CREATED).json({
        data: newVersion
      });
    });
  }
}
