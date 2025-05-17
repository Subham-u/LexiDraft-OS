/**
 * API Gateway for LexiDraft
 * Centralized routing and middleware for all microservices
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import { createLogger } from '../shared/utils/logger';
import { authenticate } from '../shared/middleware/auth';

// Import microservices
import authRouter from '../microservices/auth';
import contractsRouter from '../microservices/contracts';
import aiRouter from '../microservices/ai';
import paymentsRouter from '../microservices/payments';

// Setup logger
const logger = createLogger('api-gateway');

// Create API router
const apiRouter = Router();

// Request tracking middleware
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  req.headers['x-request-id'] = requestId;
  
  logger.info(`API Request: ${req.method} ${req.path}`, {
    requestId,
    query: req.query,
    ip: req.ip
  });
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`API Response: ${res.statusCode} in ${duration}ms`, {
      requestId,
      statusCode: res.statusCode,
      duration
    });
  });
  
  next();
});

// Global error handling middleware
apiRouter.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    logger.error(`API Error: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method
    });
    
    return res.status(err.status || 500).json({
      success: false,
      error: err.name || 'Error',
      message: err.message || 'An unexpected error occurred',
      requestId: req.headers['x-request-id']
    });
  }
  
  next();
});

// API Status endpoint (no auth required)
apiRouter.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Authentication middleware for protected routes
// Skip auth for login/register routes and status endpoint
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  if (
    req.path === '/status' || 
    (req.path.startsWith('/auth') && 
     (req.path.includes('/login') || 
      req.path.includes('/register') || 
      req.path.includes('/forgot-password')))
  ) {
    return next();
  }
  
  authenticate(req, res, next);
});

// Mount microservices
apiRouter.use('/auth', authRouter);
apiRouter.use('/contracts', contractsRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/payments', paymentsRouter);

// Catch-all for unhandled API routes
apiRouter.use('*', (req: Request, res: Response) => {
  logger.warn(`Unhandled API route: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

export default apiRouter;