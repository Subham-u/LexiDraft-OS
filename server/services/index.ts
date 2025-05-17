/**
 * Main entry point for LexiDraft services
 * Initializes and coordinates all services
 */
import { Express, Router } from 'express';
import { Server } from 'http';
import { createLogger } from '../shared/utils/logger';
import { SERVICES } from '../shared/config/service';
import { routes as userRoutes } from './user-service/src/routes';
import { routes as contractRoutes } from './contract-service/src/routes';
import { routes as paymentRoutes } from './payment-service/src/routes';
import { routes as aiRoutes } from './ai-service/src/routes';
import { routes as lawyerRoutes } from './lawyer-service/src/routes';
import { routes as consultationRoutes } from './consultation-service/src/routes';
import { routes as templateRoutes } from './template-service/src/routes';
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
  
  // Mount contract service routes
  app.use(SERVICES.contract.path, contractRoutes);
  logger.info(`Mounted contract service at ${SERVICES.contract.path}`);
  
  // Mount payment service routes
  app.use(SERVICES.payment.path, paymentRoutes);
  logger.info(`Mounted payment service at ${SERVICES.payment.path}`);
  
  // Mount AI service routes
  app.use(SERVICES.ai.path, aiRoutes);
  logger.info(`Mounted AI service at ${SERVICES.ai.path}`);
  
  // Mount lawyer service routes
  app.use(SERVICES.lawyer.path, lawyerRoutes);
  logger.info(`Mounted lawyer service at ${SERVICES.lawyer.path}`);
  
  // Mount consultation service routes
  app.use(SERVICES.consultation.path, consultationRoutes);
  logger.info(`Mounted consultation service at ${SERVICES.consultation.path}`);
  
  // Mount template service routes
  app.use(SERVICES.template.path, templateRoutes);
  logger.info(`Mounted template service at ${SERVICES.template.path}`);
  
  // TODO: Mount other service routes as they are implemented
  // app.use(SERVICES.client.path, clientRoutes);
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