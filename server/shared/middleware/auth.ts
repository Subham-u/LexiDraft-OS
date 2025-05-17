/**
 * Authentication middleware for LexiDraft services
 */
import { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import { createLogger } from '../utils/logger';

const logger = createLogger('auth-middleware');

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        uid: string;
        role: string;
      };
    }
  }
}

/**
 * Authenticate user based on Firebase UID
 * This is a simplified version - in production, JWT verification would be used
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Check for authorization header
  const authHeader = req.headers.authorization;
  
  // Development mode - check for special development token
  if (process.env.NODE_ENV === 'development' && req.headers['x-dev-uid']) {
    const uid = req.headers['x-dev-uid'] as string;
    logger.debug(`Development authentication with UID: ${uid}`);
    
    // Get user from storage
    return storage.getUserByUid(uid)
      .then(user => {
        if (!user) {
          logger.warn(`Development user not found for UID: ${uid}`);
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please sign in to access this resource'
          });
        }
        
        // Attach user to request
        req.user = {
          id: user.id,
          uid: user.uid || '',
          role: user.role
        };
        
        next();
      })
      .catch(error => {
        logger.error('Authentication error in development mode', { error });
        res.status(500).json({
          success: false,
          error: 'Authentication failed',
          message: 'An error occurred during authentication'
        });
      });
  }
  
  // Production authentication - check for Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid authorization header');
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please sign in to access this resource'
    });
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  // In production, we would verify the Firebase JWT token here
  // For now, we'll use a simplified version that assumes the token is the Firebase UID
  const uid = token;
  
  // Get user from storage
  storage.getUserByUid(uid)
    .then(user => {
      if (!user) {
        logger.warn(`User not found for UID: ${uid}`);
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please sign in to access this resource'
        });
      }
      
      // Attach user to request
      req.user = {
        id: user.id,
        uid: user.uid || '',
        role: user.role
      };
      
      next();
    })
    .catch(error => {
      logger.error('Authentication error', { error });
      res.status(500).json({
        success: false,
        error: 'Authentication failed',
        message: 'An error occurred during authentication'
      });
    });
}

/**
 * Check if user has required roles
 * @param roles Array of roles that are allowed to access the resource
 */
export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // User must be authenticated first
    if (!req.user) {
      logger.warn('Unauthorized access attempt - no user');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please sign in to access this resource'
      });
    }
    
    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt - user role ${req.user.role} not in ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        error: 'Authorization failed',
        message: 'You do not have permission to access this resource'
      });
    }
    
    // User has required role
    next();
  };
}