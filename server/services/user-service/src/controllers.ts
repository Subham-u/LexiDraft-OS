/**
 * User service controllers
 */
import { storage } from '../../../storage';
import { createLogger } from '../../../shared/utils/logger';
import { ApiError } from '../../../shared/types';
import { config } from './config';

const logger = createLogger('user-service-controllers');

export const userControllers = {
  // User login
  login: async (uid: string, email?: string) => {
    try {
      if (!uid) {
        throw ApiError.badRequest('User ID is required');
      }
      
      // Find the user in our database
      let user = await storage.getUserByUid(uid);
      
      // If user doesn't exist, create a new user record
      if (!user) {
        // We'd normally get more user info from Firebase
        const defaultUser = {
          uid,
          username: `user_${Date.now()}`,
          email: email || '',
          fullName: `New User ${Date.now()}`,
          role: 'user'
        };
        
        user = await storage.createUser(defaultUser);
      }
      
      // Return user information (without sensitive fields)
      return {
        success: true,
        user: {
          id: user.id,
          uid: user.uid,
          username: user.username,
          email: user.email,
          role: user.role,
          profileCompleted: user.profileCompleted
        }
      };
    } catch (error) {
      logger.error('Login error', { error });
      throw error;
    }
  },
  
  // Get user profile
  getProfile: async (userId: number) => {
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        throw ApiError.notFound('User not found');
      }
      
      // Return user information (excluding sensitive fields)
      return {
        success: true,
        user: {
          id: user.id,
          uid: user.uid,
          username: user.username,
          email: user.email,
          role: user.role,
          name: user.name,
          phone: user.phone,
          company: user.company,
          profileCompleted: user.profileCompleted,
          createdAt: user.createdAt
        }
      };
    } catch (error) {
      logger.error('Profile fetch error', { error });
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (userId: number, userData: any) => {
    try {
      const result = await storage.updateUser(userId, userData);
      
      return {
        success: true,
        user: {
          id: result.id,
          uid: result.uid,
          username: result.username,
          email: result.email,
          role: result.role,
          name: result.name,
          phone: result.phone,
          company: result.company,
          profileCompleted: result.profileCompleted,
          createdAt: result.createdAt
        }
      };
    } catch (error) {
      logger.error('Profile update error', { error });
      throw error;
    }
  },
  
  // Get service status
  getStatus: () => {
    return {
      success: true,
      service: 'user-service',
      version: config.version,
      available: config.firebase.available,
      message: config.firebase.available 
        ? 'Authentication service is operational' 
        : 'Authentication service is running in development mode'
    };
  }
};