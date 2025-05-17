/**
 * Microservices module for LexiDraft
 * This file exports all microservices for use in the main application
 */

import authRouter from './auth';
import contractsRouter from './contracts';
import aiRouter from './ai';
import paymentsRouter from './payments';
import { createLogger } from '../shared/utils/logger';
import { Router } from 'express';
import { checkServiceAvailability, logServiceStatus } from '../shared/config';

// Create a logger for microservices
const logger = createLogger('microservices');

// Check service availability at startup
const services = checkServiceAvailability();
logServiceStatus();

// Create a router for all microservices
const apiRouter = Router();

// Register all microservices
apiRouter.use('/auth', authRouter);
apiRouter.use('/contracts', contractsRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/payments', paymentsRouter);

// System status endpoint
apiRouter.get('/status', (req, res) => {
  const serviceStatus = checkServiceAvailability();
  
  res.json({
    success: true,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: serviceStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Log microservices initialization
logger.info('LexiDraft microservices initialized', {
  servicesAvailable: Object.entries(services)
    .filter(([_, available]) => available)
    .map(([name]) => name)
});

export default apiRouter;