/**
 * Error handling middleware
 */
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('error-middleware');

// Custom API error class
export class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
  
  // Utility methods for common error types
  static badRequest(message: string) {
    return new ApiError(400, message);
  }
  
  static unauthorized(message: string) {
    return new ApiError(401, message);
  }
  
  static forbidden(message: string) {
    return new ApiError(403, message);
  }
  
  static notFound(message: string) {
    return new ApiError(404, message);
  }
  
  static internal(message: string) {
    return new ApiError(500, message);
  }
}

// Error handler for async route handlers
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error(`API Error: ${message}`, { 
    path: req.path,
    status,
    error: err.stack
  });
  
  // Don't expose stack traces in production
  const errorResponse = {
    success: false,
    message,
    status,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };
  
  res.status(status).json(errorResponse);
};