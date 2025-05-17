/**
 * Error handling middleware for LexiDraft
 */
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('error-middleware');

/**
 * Custom API error with HTTP status code
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  // Factory methods for common errors
  static badRequest(message: string = 'Bad Request', code?: string, details?: any): ApiError {
    return new ApiError(message, 400, code, details);
  }

  static unauthorized(message: string = 'Unauthorized', code?: string, details?: any): ApiError {
    return new ApiError(message, 401, code, details);
  }

  static forbidden(message: string = 'Forbidden', code?: string, details?: any): ApiError {
    return new ApiError(message, 403, code, details);
  }

  static notFound(message: string = 'Not Found', code?: string, details?: any): ApiError {
    return new ApiError(message, 404, code, details);
  }

  static conflict(message: string = 'Conflict', code?: string, details?: any): ApiError {
    return new ApiError(message, 409, code, details);
  }

  static internal(message: string = 'Internal Server Error', code?: string, details?: any): ApiError {
    return new ApiError(message, 500, code, details);
  }
}

/**
 * Async handler wrapper to avoid try/catch blocks in route handlers
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Error handling middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  logger.error(`Error occurred: ${err.message}`, { 
    error: err, 
    path: req.path, 
    method: req.method,
    ip: req.ip
  });

  // Handle ApiError
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      error: err.code || 'api_error',
      message: err.message,
      details: err.details
    });
  }

  // Handle validation errors (e.g., from Zod)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'validation_error',
      message: 'Validation Error',
      details: err.errors
    });
  }

  // Handle other errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  return res.status(statusCode).json({
    success: false,
    error: 'server_error',
    message: statusCode === 500 ? 'Internal Server Error' : message,
    details: process.env.NODE_ENV === 'development' ? err : undefined
  });
};