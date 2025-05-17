/**
 * Routes Index - Register all API routes
 */
import express, { Router } from 'express';
import { createLogger } from '../utils/logger';

// Create router
const router: Router = express.Router();
const logger = createLogger('api-routes');

// Register routes
logger.info('Registering API routes');

// Register frontend API routes
try {
  const apiRoutes = require('./api.routes').default;
  router.use('/', apiRoutes); // Mount at root level to match frontend expected paths
  logger.info('Frontend API routes registered successfully');
} catch (error) {
  logger.error('Error loading API routes', error);
}

// Try to import and register core routes
try {
  const authRoutes = require('./auth.routes').default;
  const contractRoutes = require('./contract.routes').default;
  const templateRoutes = require('./template.routes').default;
  const adminRoutes = require('./admin.routes').default;
  
  router.use('/auth', authRoutes);
  router.use('/contracts', contractRoutes);
  router.use('/templates', templateRoutes);
  router.use('/admin', adminRoutes);
  
  logger.info('Core routes registered successfully');
} catch (error) {
  logger.error('Error loading core routes', error);
}

// Try to import and register new feature routes
try {
  const paymentRoutes = require('./payment.routes').default;
  router.use('/payments', paymentRoutes);
  logger.info('Payment routes registered successfully');
} catch (error) {
  logger.warn('Payment routes not available', error);
}

try {
  const subscriptionRoutes = require('./subscription.routes').default;
  router.use('/subscriptions', subscriptionRoutes);
  logger.info('Subscription routes registered successfully');
} catch (error) {
  logger.warn('Subscription routes not available', error);
}

try {
  const analysisRoutes = require('./analysis.routes').default;
  router.use('/analysis', analysisRoutes);
  logger.info('Analysis routes registered successfully');
} catch (error) {
  logger.warn('Analysis routes not available', error);
}

try {
  const notificationRoutes = require('./notification.routes').default;
  router.use('/notifications', notificationRoutes);
  logger.info('Notification routes registered successfully');
} catch (error) {
  logger.warn('Notification routes not available', error);
}

try {
  const chatRoutes = require('./chat.routes').default;
  router.use('/chat', chatRoutes);
  logger.info('Chat routes registered successfully');
} catch (error) {
  logger.warn('Chat routes not available', error);
}

logger.info('API routes registration completed');

export default router;