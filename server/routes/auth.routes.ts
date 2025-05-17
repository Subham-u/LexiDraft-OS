/**
 * Authentication routes
 */
import express, { Router } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../shared/middleware/error';
import { createLogger } from '../shared/utils/logger';
import { insertUserSchema } from '@shared/schema';

const router: Router = express.Router();
const logger = createLogger('auth-routes');

/**
 * Register or update a user
 */
router.post("/register", asyncHandler(async (req, res) => {
  const userData = insertUserSchema.parse(req.body);
  const existingUser = await storage.getUserByUid(userData.uid);
  
  if (existingUser) {
    // Update user if they already exist
    logger.info(`Updating existing user: ${existingUser.id}`);
    const updatedUser = await storage.updateUser(existingUser.id, userData);
    return res.status(200).json({
      success: true,
      data: updatedUser
    });
  }
  
  // Create new user
  logger.info(`Creating new user with uid: ${userData.uid}`);
  const newUser = await storage.createUser(userData);
  
  return res.status(201).json({
    success: true,
    data: newUser
  });
}));

export default router;