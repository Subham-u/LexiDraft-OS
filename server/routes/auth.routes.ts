/**
 * Authentication routes
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import * as authService from '../services/auth.service';
import { insertUserSchema } from '../../shared/schema';
import { z } from 'zod';

const router: Router = express.Router();
const logger = createLogger('auth-routes');

// Validation schemas
const signupSchema = insertUserSchema;
const signinSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6)
});
const forgotPasswordSchema = z.object({
  email: z.string().email()
});
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6)
});
const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  avatar: z.string().optional()
});

/**
 * Signup a new user
 * @route POST /api/auth/signup
 */
router.post("/signup", asyncHandler(async (req: Request, res: Response) => {
  logger.info('Signup request received');
  const userData = signupSchema.parse(req.body);
  
  const user = await authService.registerUser(userData);
  
  // Generate JWT tokens for the user
  const tokens = await import('../services/jwt.service').then(jwtService => 
    jwtService.generateTokens(user.uid, user.role || 'user')
  );
  
  // Set tokens in response headers
  res.setHeader('X-Access-Token', tokens.accessToken);
  res.setHeader('X-Refresh-Token', tokens.refreshToken);
  
  return res.status(201).json({
    success: true,
    data: {
      uid: user.uid,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role || 'user'
    },
    tokens
  });
}));

/**
 * Signin user
 * @route POST /api/auth/signin
 */
router.post("/signin", asyncHandler(async (req: Request, res: Response) => {
  logger.info('Signin request received');
  const { username, password } = signinSchema.parse(req.body);
  
  const user = await authService.loginUser(username, password);
  
  // Generate JWT tokens for the user
  const tokens = await import('../services/jwt.service').then(jwtService => 
    jwtService.generateTokens(user.uid, user.role || 'user')
  );
  
  // Set tokens in response headers
  res.setHeader('X-Access-Token', tokens.accessToken);
  res.setHeader('X-Refresh-Token', tokens.refreshToken);
  
  return res.json({
    success: true,
    data: {
      uid: user.uid,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    },
    tokens
  });
}));

/**
 * Logout user
 * @route POST /api/auth/logout
 */
router.post("/logout", authenticate, asyncHandler(async (req: Request, res: Response) => {
  logger.info(`Logout request received for user: ${req.user?.uid}`);
  
  // Clear tokens from response headers
  res.removeHeader('X-Access-Token');
  res.removeHeader('X-Refresh-Token');
  
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * Refresh auth tokens
 * @route POST /api/auth/refresh-tokens
 */
router.post("/refresh-tokens", asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw ApiError.badRequest('Refresh token is required');
  }
  
  logger.info('Token refresh requested');
  
  const tokens = await authService.refreshTokens(refreshToken);
  
  // Set tokens in response headers
  res.setHeader('X-Access-Token', tokens.accessToken);
  res.setHeader('X-Refresh-Token', tokens.refreshToken);
  
  return res.json({
    success: true,
    data: tokens
  });
}));

/**
 * Send forgot password email
 * @route POST /api/auth/forgot-password
 */
router.post("/forgot-password", asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  
  await authService.sendPasswordResetEmail(email);
  
  return res.json({
    success: true,
    message: 'Password reset email sent successfully'
  });
}));

/**
 * Reset password
 * @route POST /api/auth/reset-password
 */
router.post("/reset-password", asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = resetPasswordSchema.parse(req.body);
  
  await authService.resetPassword(token, password);
  
  return res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

/**
 * Send verification email
 * @route POST /api/auth/send-verification-email
 */
router.post("/send-verification-email", authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('User not authenticated');
  }
  
  await authService.sendVerificationEmail(req.user.email);
  
  return res.json({
    success: true,
    message: 'Verification email sent successfully'
  });
}));

/**
 * Verify email
 * @route POST /api/auth/verify-email
 */
router.post("/verify-email", asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  
  if (!token) {
    throw ApiError.badRequest('Verification token is required');
  }
  
  await authService.verifyEmail(token);
  
  return res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

/**
 * Get user profile
 * @route GET /api/auth/me
 */
router.get("/me", authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('User not authenticated');
  }
  
  return res.json({
    success: true,
    data: {
      uid: req.user.uid,
      username: req.user.username,
      email: req.user.email,
      fullName: req.user.fullName,
      role: req.user.role,
      avatar: req.user.avatar
    }
  });
}));

/**
 * Update user profile
 * @route PUT /api/auth/me
 */
router.put("/me", authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('User not authenticated');
  }
  
  const updateData = updateProfileSchema.parse(req.body);
  
  const updatedUser = await authService.updateUserProfile(req.user.uid, updateData);
  
  return res.json({
    success: true,
    data: {
      uid: updatedUser.uid,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      avatar: updatedUser.avatar
    }
  });
}));

/**
 * Update user role (admin only)
 * @route PATCH /api/auth/role/:uid
 */
router.patch("/role/:uid", authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Ensure user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required',
      status: 403
    });
  }
  
  const uid = req.params.uid;
  const { role } = req.body;
  
  if (!role) {
    return res.status(400).json({
      success: false,
      message: 'Role is required',
      status: 400
    });
  }
  
  logger.info(`Updating user ${uid} role to ${role}`);
  
  const updatedUser = await authService.updateUserRole(uid, role);
  
  return res.json({
    success: true,
    data: updatedUser
  });
}));

/**
 * Delete a user (admin only or self)
 * @route DELETE /api/auth/users/:uid
 */
router.delete("/users/:uid", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const uid = req.params.uid;
  
  // Check permissions: user can delete themselves or admin can delete anyone
  if (req.user?.uid !== uid && req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only delete your own account',
      status: 403
    });
  }
  
  logger.info(`Deleting user: ${uid}`);
  
  await authService.deleteUser(uid);
  
  return res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

export default router;