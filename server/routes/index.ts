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

// Register all routes
router.use('/auth', authRoutes);
router.use('/contracts', contractRoutes);
router.use('/templates', templateRoutes);

// Export the router
export default router;