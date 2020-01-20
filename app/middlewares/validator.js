//import et from '../index';
import {header} from 'express-validator';

exports.getUserInfo = [
  header('sn').isNumeric().withMessage('NumBER_TYPE_INVALID')
    .isLength({min:8,max:8}).withMessage('NumBER_LENGTH_INVALID')
    .exists().withMessage('NumBER_DOES_NOT_EXIST')
];


// exports.register = [
//   header('deviceid').exists().withMessage(et.translate(et.localeKey,'DEVICEID_DOES_NOT_EXIST'))
// ];

