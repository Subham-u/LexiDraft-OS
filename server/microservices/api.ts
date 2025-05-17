/**
 * Legacy API routes compatibility layer
 * This file maintains backward compatibility with existing client code
 * while redirecting to the new microservices architecture
 */

import express, { Router } from 'express';
import { authenticate } from '../shared/middleware/auth';
import contractsRouter from './contracts';
import authRouter from './auth';
import aiRouter from './ai';
import paymentsRouter from './payments';
import { createLogger } from '../shared/utils/logger';

const logger = createLogger('api-compat');
const apiRouter = Router();

// Authentication middleware (except for auth endpoints)
apiRouter.use((req, res, next) => {
  if (req.path.startsWith('/auth') || req.path === '/status') {
    return next();
  }
  authenticate(req, res, next);
});

// API Status endpoint
apiRouter.get('/status', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Map legacy endpoints to microservices

// Auth endpoints
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', (req, res, next) => {
  logger.info('Legacy route accessed: /users -> /auth');
  req.url = req.url.replace(/^\/users/, '/profile');
  authRouter(req, res, next);
});

// Contract endpoints
apiRouter.use('/contracts', contractsRouter);
apiRouter.use('/templates', (req, res, next) => {
  // Templates functionality is now part of the contracts microservice
  req.url = `/templates${req.url}`;
  contractsRouter(req, res, next);
});
apiRouter.use('/dashboard', (req, res, next) => {
  if (req.url.startsWith('/stats')) {
    logger.info('Legacy route accessed: /dashboard/stats -> /contracts/analysis');
    req.url = '/analysis';
    contractsRouter(req, res, next);
  } else {
    next();
  }
});

// AI endpoints
apiRouter.use('/ai', aiRouter);
apiRouter.use('/analyze', (req, res, next) => {
  logger.info('Legacy route accessed: /analyze -> /ai/analyze-clause');
  req.url = '/analyze-clause';
  aiRouter(req, res, next);
});
apiRouter.use('/generate', (req, res, next) => {
  logger.info('Legacy route accessed: /generate -> /contracts/generate');
  req.url = '/generate';
  contractsRouter(req, res, next);
});

// Payment endpoints
apiRouter.use('/payments', paymentsRouter);

// Map other legacy endpoints
const legacyRoutes = [
  { path: '/clients', target: '/contracts/clients' },
  { path: '/consultations', target: '/payments/consultations' },
  { path: '/lawyers', target: '/payments/lawyers' }
];

legacyRoutes.forEach(({ path, target }) => {
  apiRouter.use(path, (req, res, next) => {
    const [service, endpoint] = target.split('/').filter(Boolean);
    logger.info(`Legacy route accessed: ${path} -> ${target}`);
    
    switch (service) {
      case 'contracts':
        req.url = `/${endpoint}${req.url}`;
        return contractsRouter(req, res, next);
      case 'payments':
        req.url = `/${endpoint}${req.url}`;
        return paymentsRouter(req, res, next);
      default:
        return next();
    }
  });
});

// Catch-all for unhandled API routes
apiRouter.use('*', (req, res) => {
  logger.warn(`Unhandled API route: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

export default apiRouter;