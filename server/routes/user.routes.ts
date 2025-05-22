/**
 * User Management API Routes
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { createLogger } from '../utils/logger';
import { insertUserSchema } from '../../shared/schema';
import { z } from 'zod';
import * as userService from '../services/user.service';

const router = Router();
const logger = createLogger('user-routes');

// Validation schema for user update
const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  fullName: z.string().min(1).optional(),
  avatar: z.string().optional(),
  role: z.enum(['user', 'admin']).optional().default('user')
});

/**
 * @route POST /api/users
 * @desc Create a new user (Admin only)
 */
router.post('/users', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required'
    });
  }

  logger.info('Creating new user');
  
  try {
    // Validate user data and ensure role is set
    const userData = {
      ...insertUserSchema.parse(req.body),
      role: req.body.role || 'user' // Ensure role is set
    };
    
    // Create user
    const user = await userService.createUser(userData);
    
    return res.status(201).json({
      success: true,
      data: {
        uid: user.uid,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error: any) {
    logger.error(`Error creating user: ${error.message}`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data',
        errors: error.errors
      });
    }
    throw error;
  }
}));

/**
 * @route GET /api/users
 * @desc Get all users (Admin only)
 */
router.get('/users', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required'
    });
  }

  logger.info('Getting all users');
  
  try {
    const users = await userService.getAllUsers();
    
    return res.json({
      success: true,
      data: users.map(user => ({
        uid: user.uid,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }))
    });
  } catch (error:any) {
    logger.error(`Error getting users: ${error.message}`, error);
    throw error;
  }
}));

/**
 * @route GET /api/users/:userId
 * @desc Get user by ID
 */
router.get('/users/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // Check if user is requesting their own data or is admin
  if (req.user?.uid !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only access your own user data'
    });
  }

  logger.info(`Getting user with ID: ${userId}`);
  
  try {
    const user = await userService.getUserByUid(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.json({
      success: true,
      data: {
        uid: user.uid,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error:any) {
    logger.error(`Error getting user: ${error.message}`, error);
    throw error;
  }
}));

/**
 * @route PUT /api/users/:userId
 * @desc Update user
 */
router.put('/users/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // Check if user is updating their own data or is admin
  if (req.user?.uid !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only update your own user data'
    });
  }

  logger.info(`Updating user with ID: ${userId}`);
  
  try {
    // Validate update data
    const updateData = updateUserSchema.parse(req.body);
    
    // Update user
    const updatedUser = await userService.updateUser(userId, updateData);
    
    return res.json({
      success: true,
      data: {
        uid: updatedUser.uid,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error:any) {
    logger.error(`Error updating user: ${error.message}`, error);
    throw error;
  }
}));

/**
 * @route DELETE /api/users/:userId
 * @desc Delete user
 */
router.delete('/users/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // Check if user is deleting their own account or is admin
  if (req.user?.uid !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only delete your own account'
    });
  }

  logger.info(`Deleting user with ID: ${userId}`);
  
  try {
    await userService.deleteUser(userId);
    
    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting user: ${error.message}`, error);
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    throw error;
  }
}));
export default router; 