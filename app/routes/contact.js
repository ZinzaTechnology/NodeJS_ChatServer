import express from 'express';
import * as url from '../constants/url';
import * as ContactController from '../controllers/contact';
import * as OnlineUsersController from '../controllers/onlineUser';
import passportService from '../middlewares/passport'; // eslint-disable-line no-unused-vars
import passport from 'passport';

const router = express.Router();
const requireAuth = passport.authenticate('jwt', { session: false });

// Export Contact
router.post(url.exportCT, requireAuth, ContactController.exportContact);
// Check Online
router.post(url.online, requireAuth, OnlineUsersController.checkOnline);

export default router;
