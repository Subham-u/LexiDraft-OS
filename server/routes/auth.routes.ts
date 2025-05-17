/**
 * Authentication routes
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import * as authService from '../services/auth.service';
import { insertUserSchema } from '../../shared/schema';

const router: Router = express.Router();
const logger = createLogger('auth-routes');

/**
 * Register or update a user
 * @route POST /api/auth/register
 */
router.post("/register", asyncHandler(async (req: Request, res: Response) => {
  logger.info('Register user request received');
  const userData = insertUserSchema.parse(req.body);
  
  const user = await authService.registerUser(userData);
  
  // Generate JWT tokens for the user
  const tokens = await import('../services/jwt.service').then(jwtService => 
    jwtService.generateTokens(user.id, user.uid, user.role || 'user')
  );
  
  // Set tokens in response headers
  res.setHeader('X-Access-Token', tokens.accessToken);
  res.setHeader('X-Refresh-Token', tokens.refreshToken);
  
  return res.status(201).json({
    success: true,
    data: user,
    tokens
  });
}));

/**
 * Get the current authenticated user
 * @route GET /api/auth/me
 */
router.get("/me", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  logger.info(`Get current user: ${req.user?.id}`);
  
  // User is already attached to request by authentication middleware
  return res.json({
    success: true,
    data: req.user
  });
}));

/**
 * Update user role (admin only)
 * @route PATCH /api/auth/role/:id
 */
router.patch("/role/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  // Ensure user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required',
      status: 403
    });
  }
  
  const userId = parseInt(req.params.id);
  const { role } = req.body;
  
  if (!role) {
    return res.status(400).json({
      success: false,
      message: 'Role is required',
      status: 400
    });
  }
  
  logger.info(`Updating user ${userId} role to ${role}`);
  
  const updatedUser = await authService.updateUserRole(userId, role);
  
  return res.json({
    success: true,
    data: updatedUser
  });
}));

/**
 * Delete a user (admin only or self)
 * @route DELETE /api/auth/users/:id
 */
router.delete("/users/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  
  // Check permissions: user can delete themselves or admin can delete anyone
  if (req.user?.id !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only delete your own account',
      status: 403
    });
  }
  
  logger.info(`Deleting user: ${userId}`);
  
  await authService.deleteUser(userId);
  
  return res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 */
router.post("/refresh-token", asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw ApiError.badRequest('Refresh token is required');
  }
  
  logger.info('Token refresh requested');
  
  // Import JWT service and refresh the token
  const jwtService = await import('../services/jwt.service');
  const accessToken = jwtService.refreshAccessToken(refreshToken);
  
  // Set the new access token in response headers
  res.setHeader('X-Access-Token', accessToken);
  
  return res.json({
    success: true,
    data: {
      accessToken
    }
  });
}));

export default router;