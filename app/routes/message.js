import express from 'express';
import passportService from '../middlewares/passport'; // eslint-disable-line no-unused-vars
import passport from 'passport';
import * as MessageController from '../controllers/message';

const router = express.Router();
const requireAuth = passport.authenticate('jwt', { session: false });

router.get('/', requireAuth, MessageController.loadOldMessages);

export default router;
