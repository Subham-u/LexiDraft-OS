/**
 * Validation utilities for LexiDraft
 * Provides consistent request validation across all services
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from './errors';
import { validationErrorResponse } from './responses';

/**
 * Validate request using a Zod schema
 * @param schema Zod schema for validation
 * @param source Source of the data to validate ('body', 'query', 'params')
 */
export function validateRequest(schema: z.ZodType<any>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];
      const result = schema.safeParse(dataToValidate);
      
      if (!result.success) {
        const formattedErrors = formatZodErrors(result.error);
        return validationErrorResponse(res, formattedErrors);
      }
      
      // Replace the request data with the validated data
      req[source] = result.data;
      return next();
    } catch (error) {
      next(new ValidationError('Request validation failed'));
    }
  };
}

/**
 * Format Zod errors into a consistent format
 * @param error Zod validation error
 * @returns Formatted error messages
 */
function formatZodErrors(error: z.ZodError): Record<string, string>[] {
  return error.errors.map(err => {
    const field = err.path.join('.');
    return {
      field: field || 'unknown',
      message: err.message
    };
  });
}

/**
 * Validate an object directly against a schema
 * @param data Data to validate
 * @param schema Zod schema for validation
 * @throws ValidationError if validation fails
 */
export function validateData<T>(data: any, schema: z.ZodType<T>): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const formattedErrors = formatZodErrors(result.error);
    throw new ValidationError('Data validation failed', formattedErrors);
  }
  
  return result.data;
}