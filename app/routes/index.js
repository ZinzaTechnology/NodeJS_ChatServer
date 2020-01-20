import * as HealthCheckController from '../controllers/healthCheck';
import * as url from '../constants/url';
import authRoutes from './auth';
import userRoutes from './user';
import contactRoutes from './contact';
import messageRoutes from './message';
import configRoutes from './config';
import metricsRoutes from './metrics';
import { requireAdmin } from '../middlewares/authAdmin.js';

export default app => {
  app.get(
    url.readinessHealthCheck,
    requireAdmin,
    HealthCheckController.readiness
  );
  app.get(
    url.livenessHealthCheck,
    requireAdmin,
    HealthCheckController.liveness
  );

  // api/v1/auth
  app.use(url.v1 + url.auth, authRoutes);

  // api/v1/user
  app.use(url.v1 + url.user, userRoutes);

  // api/v1/contact
  app.use(url.v1 + url.contact, contactRoutes);

  // api/v1/metrics
  app.use(url.v1 + url.metrics, metricsRoutes);

  // api/v1/messages
  app.use(url.v1 + url.messages, messageRoutes);

  // api/v1/config
  app.use(url.v1 + url.config, configRoutes);
};
