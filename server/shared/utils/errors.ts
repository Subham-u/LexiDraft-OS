/**
 * Error handling utilities for LexiDraft
 * Provides standardized error classes and handling
 */

import { createLogger } from './logger';

const logger = createLogger('error-handler');

// Base application error class
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string, 
    status: number = 500, 
    code: string = 'INTERNAL_ERROR', 
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'RESOURCE_NOT_FOUND') {
    super(message, 404, code, true);
  }
}

export class ValidationError extends AppError {
  public readonly validationErrors: Record<string, string>[];
  
  constructor(message: string = 'Validation failed', validationErrors: Record<string, string>[] = []) {
    super(message, 400, 'VALIDATION_ERROR', true);
    this.validationErrors = validationErrors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED', true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(message, 403, 'ACCESS_DENIED', true);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} service is currently unavailable`, 503, 'SERVICE_UNAVAILABLE', true);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message: string = 'Payment required to access this resource') {
    super(message, 402, 'PAYMENT_REQUIRED', true);
  }
}

// Error handling helper functions
export function handleError(error: Error | AppError): {
  status: number;
  body: {
    success: boolean;
    error: string;
    message: string;
    code?: string;
    validationErrors?: Record<string, string>[];
  }
} {
  // If it's an AppError, use its properties
  if (error instanceof AppError) {
    logger.error(`${error.name}: ${error.message}`, {
      status: error.status,
      code: error.code,
      stack: error.stack
    });
    
    const response = {
      success: false,
      error: error.name,
      message: error.message,
      code: error.code
    };
    
    // Add validation errors if available
    if (error instanceof ValidationError && error.validationErrors?.length) {
      return {
        status: error.status,
        body: {
          ...response,
          validationErrors: error.validationErrors
        }
      };
    }
    
    return {
      status: error.status,
      body: response
    };
  }
  
  // For unhandled errors, log and return a generic response
  logger.error(`Unhandled Error: ${error.message}`, {
    name: error.name,
    stack: error.stack
  });
  
  return {
    status: 500,
    body: {
      success: false,
      error: 'InternalServerError',
      message: 'An unexpected error occurred'
    }
  };
}

// Request handler wrapper to catch async errors
export function asyncHandler(fn: Function) {
  return function(req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}