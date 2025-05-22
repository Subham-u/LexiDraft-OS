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

interface TokenPayload {
  uid: string;
  role?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Generate access token for authenticated user
 */
export function generateAccessToken(uid: string, role: string): string {
  try {
    if (!uid || !role) {
      throw new Error('Missing required token payload');
    }

    return jwt.sign(
      { 
        uid,
        role,
        type: 'access'
      } as TokenPayload,
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  } catch (error) {
    logger.error('Error generating access token', { error });
    throw new Error('Failed to generate access token');
  }
}

/**
 * Generate refresh token for authenticated user
 */
export function generateRefreshToken(uid: string): string {
  try {
    if (!uid) {
      throw new Error('Missing required token payload');
    }

    return jwt.sign(
      { 
        uid,
        type: 'refresh'
      } as TokenPayload,
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  } catch (error) {
    logger.error('Error generating refresh token', { error });
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): TokenPayload {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Validate required fields
    if (!payload.uid || !payload.type) {
      throw new Error('Invalid token payload');
    }

    return payload;
  } catch (error) {
    logger.error('Token verification failed', { error });
    
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
export function generateTokens(uid: string, role: string): { accessToken: string; refreshToken: string } {
  try {
    if (!uid || !role) {
      throw new Error('Missing required parameters');
    }

    return {
      accessToken: generateAccessToken(uid, role),
      refreshToken: generateRefreshToken(uid)
    };
  } catch (error) {
    logger.error('Error generating tokens', { error });
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(refreshToken: string): string {
  try {
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }

    // Verify the refresh token
    const payload = verifyToken(refreshToken);
    
    // Check if it's a refresh token
    if (payload.type !== 'refresh') {
      throw ApiError.unauthorized('Invalid token type');
    }
    
    // Generate a new access token
    return generateAccessToken(payload.uid, payload.role || 'user');
  } catch (error) {
    logger.error('Failed to refresh access token', { error });
    throw error;
  }
}