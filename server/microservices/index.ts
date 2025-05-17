/**
 * Legacy microservices index
 * This file is maintained for backward compatibility during the transition to the new architecture
 */
import express, { Router } from 'express';
import { createLogger } from '../shared/utils/logger';

// Create router for legacy API routes
const apiRouter: Router = express.Router();
const logger = createLogger('legacy-microservices');

// Health check endpoint
apiRouter.get('/status', (req, res) => {
  res.json({
    success: true,
    service: 'api-legacy',
    status: 'operational',
    timestamp: new Date().toISOString(),
    message: 'Legacy API compatibility layer is active'
  });
});

// Temporary handlers for specific endpoints
apiRouter.get('/contracts/recent', (req, res) => {
  logger.info(`Legacy route accessed: ${req.method} ${req.originalUrl}`);
  
  res.status(200).json({
    success: true,
    data: []
  });
});

apiRouter.get('/consultations', (req, res) => {
  logger.info(`Legacy route accessed: ${req.method} ${req.originalUrl}`);
  
  res.status(200).json({
    success: true,
    data: []
  });
});

apiRouter.get('/contracts', (req, res) => {
  logger.info(`Legacy route accessed: ${req.method} ${req.originalUrl}`);
  
  res.status(200).json({
    success: true,
    data: []
  });
});

apiRouter.get('/templates/popular', (req, res) => {
  logger.info(`Legacy route accessed: ${req.method} ${req.originalUrl}`);
  
  res.status(200).json({
    success: true,
    data: []
  });
});

apiRouter.get('/dashboard/stats', (req, res) => {
  logger.info(`Legacy route accessed: ${req.method} ${req.originalUrl}`);
  
  res.status(200).json({
    success: true,
    data: {
      contractsCount: 0,
      clientsCount: 0,
      pendingContractsCount: 0,
      upcomingConsultationsCount: 0
    }
  });
});

// Fallback for other routes during migration
apiRouter.use('*', (req, res) => {
  logger.info(`Unhandled legacy route accessed: ${req.method} ${req.originalUrl}`);
  
  res.status(200).json({
    success: true,
    message: 'API is undergoing maintenance and restructuring for improved service',
    migrationStatus: 'in-progress',
    service: 'legacy-api'
  });
});

export default apiRouter;