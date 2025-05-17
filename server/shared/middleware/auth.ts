/**
 * Authentication middleware for LexiDraft
 */
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import { ApiError } from './error';
import { storage } from '../../storage';

const logger = createLogger('auth-middleware');

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware to verify Firebase authentication token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      throw ApiError.unauthorized('Authentication required', 'auth_required', {
        message: 'Please log in to access this resource'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // In dev mode, allow bypass with special token
    if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
      req.user = { 
        id: 1,
        uid: 'dev-uid',
        email: 'dev@lexidraft.com',
        role: 'admin',
        name: 'Developer User'
      };
      return next();
    }
    
    // Verify token with Firebase (currently stubbed)
    // This would typically use firebase-admin SDK to verify tokens
    
    // Get user from database using the Firebase UID
    // const user = await storage.getUserByUid(decodedToken.uid);
    
    // For now, we'll use a fake user for testing
    req.user = {
      id: 1,
      email: 'user@example.com',
      role: 'user'
    };
    
    // Log successful authentication
    logger.info(`User ${req.user.id} successfully authenticated`);
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has required roles
 */
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user.id} attempted to access a resource requiring roles: ${roles.join(', ')}`);
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    
    next();
  };
};