/**
 * Authentication middleware
 */
import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../db';
import { users } from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from './error';
import { eq } from 'drizzle-orm';

const logger = createLogger('auth-middleware');

// Extend the Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        uid: string;
        email: string;
        role: string;
        username: string;
        fullName: string;
      };
      token?: string;
    }
  }
}

/**
 * Middleware to authenticate requests
 * Optional parameter determines if authentication is required or optional
 */
export const authenticate = (required: boolean = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (required) {
          throw ApiError.unauthorized('Authentication required');
        } else {
          // Authentication is optional, continue without user
          return next();
        }
      }
      
      const token = authHeader.split('Bearer ')[1];
      
      if (!token) {
        if (required) {
          throw ApiError.unauthorized('Invalid token format');
        } else {
          return next();
        }
      }
      
      // Verify the token with Firebase
      const decodedToken = await getAuth().verifyIdToken(token);
      const uid = decodedToken.uid;
      
      // Find the user in our database
      const [user] = await db.select()
        .from(users)
        .where(eq(users.uid, uid));
      
      if (!user && required) {
        throw ApiError.unauthorized('User not found');
      }
      
      // Attach the user and token to the request
      if (user) {
        req.user = {
          id: user.id,
          uid: user.uid,
          email: user.email,
          role: user.role || 'user',
          username: user.username,
          fullName: user.fullName
        };
      }
      
      req.token = token;
      next();
    } catch (error) {
      logger.error('Authentication error', { error });
      
      if (error instanceof ApiError) {
        return next(error);
      }
      
      if (required) {
        return next(ApiError.unauthorized('Invalid or expired token'));
      } else {
        // Authentication is optional, continue without user
        return next();
      }
    }
  };
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    
    next();
  };
};