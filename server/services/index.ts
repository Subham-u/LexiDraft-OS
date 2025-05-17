/**
 * Main entry point for LexiDraft services
 * Initializes and coordinates all services
 */
import { Express, Router } from 'express';
import { Server } from 'http';
import { createLogger } from '../shared/utils/logger';
import { SERVICES } from '../shared/config/service';
import { routes as userRoutes } from './user-service/src/routes';
import apiRoutes from './api-routes';

const logger = createLogger('services');

/**
 * Start all services
 * Legacy method - will be replaced by setupServices
 */
export async function startServices() {
  logger.info('Starting LexiDraft services...');
  
  // This function is now a stub for backward compatibility
  // The actual service initialization is handled by setupServices
  
  return {
    // Return empty placeholder
  };
}

/**
 * Setup services by mounting their routes on the main Express app
 * This is the new approach for service integration
 */
export async function setupServices(app: Express, server: Server) {
  logger.info('Setting up LexiDraft services...');
  
  // Mount API routes for frontend compatibility
  app.use('/api', apiRoutes);
  logger.info('Mounted API routes at /api');
  
  // Mount user service routes
  app.use(SERVICES.user.path, userRoutes);
  logger.info(`Mounted user service at ${SERVICES.user.path}`);
  
  // TODO: Mount other service routes as they are implemented
  // app.use(SERVICES.lawyer.path, lawyerRoutes);
  // app.use(SERVICES.contract.path, contractRoutes);
  // etc.
  
  return {
    app,
    server
  };
}

export default {
  startServices,
  setupServices
};