import express from 'express';
import * as AuthenticationController from '../controllers/authentication';
import * as AuthenticationValidation from '../validation/authentication';
import * as url from '../constants/url';

const router = express.Router();

// Register New Sample Number
router.post(
  url.register,
  AuthenticationValidation.validateRecaptcha,
  AuthenticationValidation.validateRegisterBody,
  AuthenticationController.newNumber
);

// Validate RecaptCha
// router.post(url.recaptcha, AuthenticationValidation.validateRecaptcha);

export default router;
