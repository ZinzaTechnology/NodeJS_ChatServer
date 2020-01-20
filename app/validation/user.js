import * as Language from '../middlewares/language';
import * as statusCode from '../constants/statusCode';
import { maxLengthPincode, maxNumberLength } from '../constants/global';

export function validateUpdateUserBody(req, res, next) {
  const { name } = req.body;

  if (name === undefined || name == '') {
    return Language.getData(req, 'USER_NAME_INVALID').then(data => {
      res.status(statusCode.BAD_REQUEST).json({ error: data });
    });
  }

  next();
}

export function validatePincodeBody(req, res, next) {
  const { pincode } = req.body;

  let errorCode = '';

  if (
    pincode === undefined ||
    pincode === '' ||
    !isNumeric(pincode) ||
    pincode.length !== maxLengthPincode
  ) {
    errorCode = 'PINCODE_IS_INVALID';
  }

  if (errorCode !== '') {
    return Language.getData(req, errorCode).then(data => {
      res.status(statusCode.BAD_REQUEST).json({ error: data });
    });
  }

  next();
}

export function validateVerifyPincode(req, res, next) {
  const { sn, did, pincode } = req.body;

  let errorCode = '';

  if (
    sn === undefined ||
    sn === '' ||
    !isNumeric(sn) ||
    sn.length !== maxNumberLength
  ) {
    errorCode = 'NumBER_INVALID';
  }

  if (
    pincode === undefined ||
    pincode === '' ||
    !isNumeric(pincode) ||
    pincode.length !== maxLengthPincode
  ) {
    errorCode = 'PINCODE_IS_INVALID';
  }

  if (did === undefined || did === '') {
    errorCode = 'DEVICE_ID_IS_INVALID';
  }

  if (errorCode != '') {
    return Language.getData(req, errorCode).then(data => {
      res.status(statusCode.BAD_REQUEST).json({ error: data });
    });
  }

  next();
}

export function validateDeviceToken(req, res, next) {
  const { sn, deviceToken } = req.body;

  if (!sn || !deviceToken) {
    return Language.getData(req, 'INVALID_PARAM').then(data => {
      res.status(statusCode.BAD_REQUEST).json({ error: data });
    });
  }

  next();
}

function isNumeric(value) {
  return /^\d+$/.test(value);
}

export function validateNumberParams(req, res, next) {
  const { sn } = req.params;

  if (sn === undefined || sn === '') {
    return Language.getData(req, 'INVALID_PARAM').then(data => {
      res.status(statusCode.BAD_REQUEST).json({ error: data });
    });
  }

  next();
}
