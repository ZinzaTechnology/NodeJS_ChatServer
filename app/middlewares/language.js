import { client } from '../index';
import config from '../../config/main';
import { logger } from '../../config/winston';

let en = require('../../config/language.en.json');
let ja = require('../../config/language.ja.json');

var dictLanguageSupport = {}; // create an empty array
dictLanguageSupport['en'] = en;
dictLanguageSupport['ja'] = ja;

function getLanguageData(langData) {
  let hashLang = [];
  for (var key in langData) {
    hashLang.push(key);
    hashLang.push(langData[key]);
  }
  return hashLang;
}

export function importLanguageData() {
  for (var lang in dictLanguageSupport) {
    let hashLangData = getLanguageData(dictLanguageSupport[lang.toString()]);
    console.log('importing language');
    client.hmset(config.keyRedis.language + ':' + lang, hashLangData, error => {
      /* istanbul ignore if */
      if (error) {
        console.log('can not import language', error);
        return;
      }
    });
  }
}

function getLanguage(req) {
  console.log(req.headers);
  let lang = req.headers['x-localization'];
  if (lang != 'ja') {
    lang = 'en';
  }
  return lang;
}

export function getData(req, langkey) {
  return new Promise(function(resolve, reject) {
    let currentLang = getLanguage(req);
    console.log('get data =', langkey, 'language=' + currentLang);
    client
      .hget(config.keyRedis.language + ':' + currentLang, langkey)
      .then(result => {
        console.log('result=', result);
        resolve(result);
      })
      .catch(err => {
        /* istanbul ignore next */
        logger.error('get language error on key', err);
        /* istanbul ignore next */
        reject(langkey);
      });
  });
}
