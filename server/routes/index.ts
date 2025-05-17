/**
 * Main routes index file to centralize route registration
 */
import express, { Router } from 'express';
import authRoutes from './auth.routes';
import contractRoutes from './contract.routes';
import templateRoutes from './template.routes';
import { createLogger } from '../utils/logger';

const router: Router = express.Router();
const logger = createLogger('api-routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Register all routes
logger.info('Registering API routes');
router.use('/auth', authRoutes);
router.use('/contracts', contractRoutes);
router.use('/templates', templateRoutes);
logger.info('API routes registered successfully');

// Export the router
export default router;