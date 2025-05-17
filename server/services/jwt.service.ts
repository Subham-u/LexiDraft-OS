/**
 * JWT service for token generation and verification
 */
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';

const logger = createLogger('jwt-service');

// Secret key for signing JWTs - in production, use an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'lexidraft-dev-secret-key';

// Token expiration time (in seconds)
const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days

/**
 * Generate access token for authenticated user
 */
export function generateAccessToken(userId: number, uid: string, role: string): string {
  try {
    return jwt.sign(
      { 
        userId, 
        uid,
        role,
        type: 'access'
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  } catch (error) {
    logger.error('Error generating access token', error);
    throw new Error('Failed to generate access token');
  }
}

/**
 * Generate refresh token for authenticated user
 */
export function generateRefreshToken(userId: number, uid: string): string {
  try {
    return jwt.sign(
      { 
        userId, 
        uid,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  } catch (error) {
    logger.error('Error generating refresh token', error);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.error('Token verification failed', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Token expired');
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid token');
    }
    
    throw ApiError.unauthorized('Token verification failed');
  }
}

/**
 * Generate both access and refresh tokens for a user
 */
export function generateTokens(userId: number, uid: string, role: string): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(userId, uid, role),
    refreshToken: generateRefreshToken(userId, uid)
  };
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(refreshToken: string): string {
  try {
    // Verify the refresh token
    const payload: any = verifyToken(refreshToken);
    
    // Check if it's a refresh token
    if (payload.type !== 'refresh') {
      throw ApiError.unauthorized('Invalid token type');
    }
    
    // Generate a new access token
    return generateAccessToken(payload.userId, payload.uid, payload.role || 'user');
  } catch (error) {
    logger.error('Failed to refresh access token', error);
    throw error;
  }
}