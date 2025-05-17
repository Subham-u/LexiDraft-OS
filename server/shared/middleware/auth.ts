import { Request, Response, NextFunction } from 'express';
import { AUTH_CONFIG, IS_PRODUCTION } from '../config';
import { storage } from '../../storage'; // For now, still using the existing storage

/**
 * Authentication middleware
 * Verifies the authentication token and attaches user information to the request
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Validate token format
    if (!token || token.length < 20) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format',
        message: 'Authentication token is malformed or missing'
      });
    }

    // In development, allow simplified authentication for testing
    if (!IS_PRODUCTION) {
      // For development only - set a mock user
      req.user = { id: 1, role: 'user', uid: 'dev-uid-123' };
      return next();
    }

    // In production, verify the token with Firebase
    // We would implement Firebase token verification here
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
          error: 'User not found',
          message: 'The user associated with this token was not found'
        });
      }

      // Add user info to request object for use in route handlers
      req.user = user;
      return next();
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({
        success: false,
        error: 'Token verification failed',
        message: 'Your authentication token could not be verified'
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication system error',
      message: 'An error occurred during authentication'
    });
  }
}

/**
 * Role-based authorization middleware
 * Requires the user to have one of the specified roles
 * @param roles Array of allowed roles
 */
export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
}

// Add types to Express Request
declare global {
  namespace Express {
    interface Request {
      user?: any; // This would be properly typed in a full implementation
    }
  }
}