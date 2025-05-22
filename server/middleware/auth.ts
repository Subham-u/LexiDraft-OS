/**
 * Authentication middleware
 */
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwt.service';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from '../utils/logger';
import { ApiError } from './error';
// import { auth as firebaseAuth } from '../config/firebase';

const logger = createLogger('auth-middleware');

// Extend the Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw ApiError.unauthorized('No authorization header');
    }

    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Invalid authorization header format');
    }

    try {
      // Verify JWT token
      const payload = verifyToken(token);
      
      // Verify token type
      if (payload.type !== 'access') {
        throw ApiError.unauthorized('Invalid token type');
      }

      // Get user from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.uid, payload.uid));

      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      // Attach user to request
      req.user = {
        uid: user.uid,
        role: user.role
      };

      next();
    } catch (error) {
      logger.error('JWT verification failed', { error });
      throw ApiError.unauthorized('Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      if (!roles.includes(req.user.role)) {
        throw ApiError.forbidden('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Commenting out Firebase authentication for now
/*
export const authenticateFirebase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw ApiError.unauthorized('No authorization header');
    }

    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Invalid authorization header format');
    }

    try {
      // Verify Firebase token
      const decodedToken = await firebaseAuth.verifyIdToken(token);
      
      // Get user from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.uid, decodedToken.uid));

      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      // Attach user to request
      req.user = {
        uid: user.uid,
        role: user.role
      };

      next();
    } catch (error) {
      logger.error('Firebase token verification failed', { error });
      throw ApiError.unauthorized('Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};
*/