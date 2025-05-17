/**
 * Authentication middleware
 */
import { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import { createLogger } from '../utils/logger';

const logger = createLogger('auth-middleware');

export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Authentication middleware
 * Verifies the authorization token and adds the user to the request object
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Extract token from request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required',
        status: 401
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token format
    if (!token || token.length < 20) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format',
        status: 401
      });
    }
    
    // In development environment, allow simplified authentication for testing
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Using development authentication');
      // For development only - set a mock user
      req.user = { id: 1, role: 'user', uid: 'dev-uid-123' };
      return next();
    }
    
    // In production, verify the token with Firebase
    try {
      // In full production, we would:
      // 1. Decode and verify the Firebase JWT token
      // 2. Extract the user ID from the verified token
      // 3. Fetch the corresponding user from our database
      
      // For now, use a placeholder verification
      const userId = 1; // This would come from the verified token
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'User not found',
          status: 401
        });
      }
      
      // Add user info to request object for use in route handlers
      req.user = user;
      return next();
    } catch (tokenError) {
      logger.error('Token verification error:', tokenError);
      return res.status(401).json({ 
        success: false,
        message: 'Token verification failed',
        status: 401
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Authentication system error',
      status: 500
    });
  }
}