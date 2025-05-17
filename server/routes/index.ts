/**
 * Main routes index file
 * Centralizes all route registration and exports a function to register them with Express
 */
import { Express, Router } from 'express';
import { Server } from 'http';
import { createLogger } from '../shared/utils/logger';
import { errorHandler } from '../shared/middleware/error';

// Import route modules
import authRoutes from './auth.routes';
import contractRoutes from './contract.routes';
import dashboardRoutes from './dashboard.routes';
import paymentRoutes from './payment.routes';
import templateRoutes from './template.routes';
import { setupWebSocketServer } from './websocket.routes';

const logger = createLogger('routes');

/**
 * Register all API routes with the Express application
 * @param app Express application
 * @param server HTTP server instance
 */
export function registerRoutes(app: Express, server: Server) {
  logger.info('Registering API routes');
  
  // Create an API router
  const apiRouter = Router();
  
  // Mount domain-specific routes on the API router
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/contracts', contractRoutes);
  apiRouter.use('/dashboard', dashboardRoutes);
  apiRouter.use('/payments', paymentRoutes);
  apiRouter.use('/templates', templateRoutes);
  
  // Mount the API router at /api
  app.use('/api', apiRouter);
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });
  
  // Setup WebSocket server
  const wss = setupWebSocketServer(server);
  
  // Register error handling middleware last
  app.use(errorHandler);
  
  logger.info('All API routes registered successfully');
  
  return { apiRouter, wss };
}