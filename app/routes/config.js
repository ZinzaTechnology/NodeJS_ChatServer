import express from 'express';
import passportService from '../middlewares/passport'; // eslint-disable-line no-unused-vars
import passport from 'passport';
import * as config from '../utils/config';
import * as url from '../constants/url';
import { requireAdmin } from '../middlewares/authAdmin.js';

const router = express.Router();
const requireAuth = passport.authenticate('jwt', { session: false });

router.get('/', requireAuth, config.getConfig);
router.post(url.versions, requireAdmin, config.updateVersion);

export default router;
