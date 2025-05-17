/**
 * Response utilities for LexiDraft
 * Standardizes API responses across the application
 */

import { Response } from 'express';

// Standard success response
export function successResponse(
  res: Response, 
  data: any = {}, 
  message: string = 'Success', 
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

// Standard error response
export function errorResponse(
  res: Response, 
  message: string = 'An error occurred', 
  statusCode: number = 500,
  errorCode: string = 'SERVER_ERROR',
  errors: any = null
) {
  const response: any = {
    success: false,
    message,
    error: errorCode,
    timestamp: new Date().toISOString()
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
}

// Not found response
export function notFoundResponse(
  res: Response, 
  message: string = 'Resource not found',
  resourceType: string = 'Resource'
) {
  return errorResponse(
    res, 
    message, 
    404, 
    'NOT_FOUND',
    { resourceType }
  );
}

// Validation error response
export function validationErrorResponse(
  res: Response, 
  errors: Record<string, string>[], 
  message: string = 'Validation failed'
) {
  return errorResponse(
    res, 
    message, 
    400, 
    'VALIDATION_ERROR', 
    errors
  );
}

// Authentication error response
export function authenticationErrorResponse(
  res: Response, 
  message: string = 'Authentication required'
) {
  return errorResponse(
    res, 
    message, 
    401, 
    'AUTHENTICATION_REQUIRED'
  );
}

// Authorization error response
export function authorizationErrorResponse(
  res: Response, 
  message: string = 'You do not have permission to access this resource'
) {
  return errorResponse(
    res, 
    message, 
    403, 
    'ACCESS_DENIED'
  );
}

// Service unavailable response
export function serviceUnavailableResponse(
  res: Response, 
  service: string
) {
  return errorResponse(
    res, 
    `${service} service is currently unavailable`, 
    503, 
    'SERVICE_UNAVAILABLE',
    { service }
  );
}

// Payment required response
export function paymentRequiredResponse(
  res: Response, 
  message: string = 'Payment required to access this resource',
  plan: string = 'premium'
) {
  return errorResponse(
    res, 
    message, 
    402, 
    'PAYMENT_REQUIRED',
    { requiredPlan: plan }
  );
}