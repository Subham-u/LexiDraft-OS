import express, { Router } from 'express';
import { userControllers } from './controllers';
import { authenticate } from '../../../shared/middleware/auth';
import { asyncHandler } from '../../../shared/middleware/error';
import { createLogger } from '../../../shared/utils/logger';

// Create router for the user service
const router: Router = express.Router();
const logger = createLogger('user-service-routes');

// User login endpoint
router.post('/login', asyncHandler(async (req, res) => {
  const { uid, email } = req.body;
  const result = await userControllers.login(uid, email);
  res.json(result);
}));

// Get current user profile
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const result = await userControllers.getProfile(req.user!.id);
  res.json(result);
}));

// Update user profile
router.patch('/profile', authenticate, asyncHandler(async (req, res) => {
  const result = await userControllers.updateProfile(req.user!.id, req.body);
  res.json(result);
}));

// Check authentication service status
router.get('/status', (req, res) => {
  const status = userControllers.getStatus();
  res.json(status);
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'user-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export const routes = router;