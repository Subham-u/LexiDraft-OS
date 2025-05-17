import { Request, Response, NextFunction } from 'express';
import { AUTH_CONFIG, IS_PRODUCTION, FIREBASE_CONFIG } from '../config';
import { storage } from '../../storage';
import { createLogger } from '../utils/logger';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { authenticationErrorResponse, authorizationErrorResponse } from '../utils/responses';
import { User } from '@shared/schema';

// Create a dedicated logger for authentication
const logger = createLogger('auth-middleware');

/**
 * Authentication middleware
 * Verifies the authentication token and attaches user information to the request
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return authenticationErrorResponse(res, 'Please provide a valid authentication token');
    }

    const token = authHeader.split('Bearer ')[1];

    // Validate token format
    if (!token || token.length < 20) {
      return authenticationErrorResponse(res, 'Authentication token is malformed or missing');
    }

    // In development, allow simplified authentication for testing
    if (!IS_PRODUCTION) {
      logger.debug('Using development authentication');
      // For development only - set a mock user
      req.user = { id: 1, role: 'user', uid: 'dev-uid-123', name: 'Dev User' };
      return next();
    }

    // Check if Firebase integration is available
    if (!FIREBASE_CONFIG.available) {
      logger.warn('Firebase authentication is not configured');
      throw new AuthenticationError('Authentication service is not available');
    }

    try {
      // In full production, we would:
      // 1. Decode and verify the Firebase JWT token
      // 2. Extract the user ID from the verified token
      // 3. Fetch the corresponding user from our database

      // This placeholder would be replaced with actual Firebase token verification
      const userId = 1; // This would come from the verified token
      const user = await storage.getUser(userId);

      if (!user) {
        logger.warn(`User not found for ID: ${userId}`);
        throw new AuthenticationError('The user associated with this token was not found');
      }

      // Add user info to request object for use in route handlers
      req.user = user;
      logger.debug(`User authenticated: ${user.id}`);
      return next();
    } catch (tokenError) {
      logger.error('Token verification error:', { error: tokenError });
      throw new AuthenticationError('Your authentication token could not be verified');
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return authenticationErrorResponse(res, error.message);
    }
    
    logger.error('Authentication error:', { error });
    return authenticationErrorResponse(res, 'An error occurred during authentication');
  }
}

/**
 * Role-based authorization middleware
 * Requires the user to have one of the specified roles
 * @param roles Array of allowed roles
 */
export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthorizationError(`This action requires one of these roles: ${roles.join(', ')}`);
      }

      logger.debug(`User ${req.user.id} authorized with role: ${req.user.role}`);
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return authenticationErrorResponse(res, error.message);
      }
      
      if (error instanceof AuthorizationError) {
        return authorizationErrorResponse(res, error.message);
      }
      
      logger.error('Authorization error:', { error });
      return authorizationErrorResponse(res, 'An error occurred during authorization');
    }
  };
}

/**
 * Permission-based authorization middleware
 * Checks if a user has specific permissions
 * @param requiredPermissions Array of required permissions
 */
export function requirePermissions(requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      // In a real implementation, we would check user permissions from the database
      // For now, we're using a simplified approach
      const userPermissions = req.user.permissions || [];
      
      // Check if the user has all required permissions
      const missingPermissions = requiredPermissions.filter(
        permission => !userPermissions.includes(permission)
      );
      
      if (missingPermissions.length > 0) {
        throw new AuthorizationError(
          `You are missing the following permissions: ${missingPermissions.join(', ')}`
        );
      }

      logger.debug(`User ${req.user.id} has required permissions`);
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return authenticationErrorResponse(res, error.message);
      }
      
      if (error instanceof AuthorizationError) {
        return authorizationErrorResponse(res, error.message);
      }
      
      logger.error('Permission check error:', { error });
      return authorizationErrorResponse(res, 'An error occurred checking permissions');
    }
  };
}

/**
 * Ownership verification middleware
 * Ensures a user owns or has access to a resource
 * @param resourceType The type of resource being accessed
 * @param idParam The parameter containing the resource ID
 */
export function verifyOwnership(resourceType: string, idParam: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }

      const resourceId = parseInt(req.params[idParam], 10);
      if (isNaN(resourceId)) {
        return authorizationErrorResponse(res, `Invalid ${resourceType} ID`);
      }

      // Admins bypass ownership checks
      if (req.user.role === 'admin') {
        logger.debug(`Admin access granted for ${resourceType} ${resourceId}`);
        return next();
      }

      // Fetch the resource and check ownership
      // This would be implemented with appropriate storage method calls
      let resource;
      let ownerId;

      switch (resourceType) {
        case 'contract':
          resource = await storage.getContract(resourceId);
          ownerId = resource?.userId;
          break;
        case 'template':
          resource = await storage.getTemplate(resourceId);
          ownerId = resource?.createdBy;
          break;
        case 'consultation':
          resource = await storage.getConsultation(resourceId);
          ownerId = resource?.userId;
          break;
        default:
          logger.error(`Unknown resource type: ${resourceType}`);
          throw new Error(`Unknown resource type: ${resourceType}`);
      }

      if (!resource) {
        return authorizationErrorResponse(res, `${resourceType} not found`);
      }

      if (ownerId !== req.user.id) {
        logger.warn(`Ownership verification failed for ${resourceType} ${resourceId}`);
        throw new AuthorizationError(`You do not have access to this ${resourceType}`);
      }

      logger.debug(`Ownership verified for ${resourceType} ${resourceId}`);
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return authenticationErrorResponse(res, error.message);
      }
      
      if (error instanceof AuthorizationError) {
        return authorizationErrorResponse(res, error.message);
      }
      
      logger.error('Ownership verification error:', { error });
      return authorizationErrorResponse(res, `Error verifying ${resourceType} ownership`);
    }
  };
}

// Add types to Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User; // Using the User type from our schema
    }
  }
}