/**
 * Error handling middleware and error utilities
 */
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createLogger } from '../utils/logger';

const logger = createLogger('error-middleware');

/**
 * Custom API Error class with status code and standardized format
 */
export class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
  
  // Factory methods for common error types
  static badRequest(message: string = 'Bad Request'): ApiError {
    return new ApiError(400, message);
  }
  
  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }
  
  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }
  
  static notFound(message: string = 'Not Found'): ApiError {
    return new ApiError(404, message);
  }
  
  static conflict(message: string = 'Conflict'): ApiError {
    return new ApiError(409, message);
  }
  
  static internal(message: string = 'Internal Server Error'): ApiError {
    return new ApiError(500, message);
  }
}

/**
 * Async handler to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  
  // Log the error
  logger.error(`Error: ${message}`, { 
    status, 
    path: req.path, 
    method: req.method,
    error: err.stack
  });
  
  // Handle specific error types
  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation Error';
    return res.status(status).json({
      success: false,
      message,
      errors: err.errors,
      status
    });
  }
  
  // Return error response
  return res.status(status).json({
    success: false,
    message,
    status
  });
};