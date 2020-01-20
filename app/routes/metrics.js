import express from 'express';
import { metrics } from '../controllers/metrics';

const router = express.Router();

// Update CCU
router.get('/', metrics);

export default router;
