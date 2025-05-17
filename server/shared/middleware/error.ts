/**
 * Error handling middleware for LexiDraft services
 */
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('error-middleware');

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler middleware
 */
export function errorHandler(err: ErrorWithStatus, req: Request, res: Response, _next: NextFunction) {
  // Determine status code - default to 500 if not provided
  const status = err.status || err.statusCode || 500;
  
  // Get error message
  const message = err.message || 'Internal Server Error';
  
  // Log the error with full details for debugging
  logger.error(`Error: ${message}`, { 
    status, 
    path: req.path,
    method: req.method,
    stack: err.stack,
    code: err.code
  });
  
  // Send appropriate response
  res.status(status).json({ 
    success: false, 
    error: status >= 500 ? 'Internal Server Error' : message,
    message: status >= 500 
      ? 'Something went wrong. Please try again later.' 
      : message,
    status 
  });
}

/**
 * Not found error handler - use at the end of routes
 */
export function notFoundHandler(req: Request, res: Response) {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    status: 404
  });
}

/**
 * Async error handler wrapper - catches async errors and passes to next()
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}