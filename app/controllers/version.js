import { client } from '../index';
import * as constants from '../constants/global';
import * as Language from '../middlewares/language';
import logger from '../../config/winston';

/* istanbul ignore next */
export function checkVersion(data, io, socket) {
  if (!data || !data.v || data.v == '' || !data.b || data.b == '') {
    return;
  }

  client.get('version', (err, version) => {
    /* istanbul ignore if */
    if (err) {
      logger.error('Redis check version err', err);
    }

    if (version) {
      console.log('Version Now: ', version);
      let modifyVersion = JSON.parse(version);

      if (
        Number(data.v) < Number(modifyVersion.v) ||
        (Number(data.v) === Number(modifyVersion.v) &&
          Number(data.b) < Number(modifyVersion.b))
      ) {
        const req = {
          headers: {
            'x-localization': data.language
          }
        };

        Promise.all([
          Language.getData(req, 'OLD_VERSION_CONTENT'),
          Language.getData(req, 'OLD_VERSION_TITLE')
        ]).then(res => {
          const content = res[0];
          const title = res[1];

          return io.to(socket.decoded.sn).emit('check-version', {
            data: {
              link: constants.appStoreUrl,
              content,
              title
            }
          });
        });
      }
    }
  });
}
