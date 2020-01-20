import express from 'express';
import * as UserController from '../controllers/user';
import * as UserValidation from '../validation/user';
import * as url from '../constants/url';
import passportService from '../middlewares/passport'; // eslint-disable-line no-unused-vars
import passport from 'passport';
import * as pincode from '../utils/pincode';

const router = express.Router();
const requireAuth = passport.authenticate('jwt', { session: false });

router.get(
  '/:sn',
  requireAuth,
  UserValidation.validateNumberParams,
  UserController.getUserByNumber
);

// Reset Sample Number
router.put(url.reset, requireAuth, UserController.resetNumber);

// Update User Info
router.put(
  '/',
  requireAuth,
  UserValidation.validateUpdateUserBody,
  UserController.updateInfo
);

// Delete Sample Number
router.delete(url.deleteSN, requireAuth, UserController.deleteNumber);

// Set Pincode
router.put(
  url.PinCode,
  requireAuth,
  UserValidation.validatePincodeBody,
  pincode.setPinCode
);

// Verify Pincode
router.post(
  url.PinCode,
  UserValidation.validateVerifyPincode,
  pincode.verifyPinCode
);

// Update Device Token
router.put(
  url.deviceToken,
  requireAuth,
  UserValidation.validateDeviceToken,
  UserController.sendDeviceToken
);

export default router;
