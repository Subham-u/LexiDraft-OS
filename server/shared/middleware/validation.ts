/**
 * Request validation middleware for LexiDraft services
 */
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { createLogger } from '../utils/logger';

const logger = createLogger('validation-middleware');

/**
 * Validate request body against a Zod schema
 * @param schema Zod schema to validate against
 */
export function validateBody(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        logger.warn('Validation error', { error: validationError });
        
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: validationError.message,
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      next(error);
    }
  };
}

/**
 * Validate request query parameters against a Zod schema
 * @param schema Zod schema to validate against
 */
export function validateQuery(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.query);
      req.query = result; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        logger.warn('Query validation error', { error: validationError });
        
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: validationError.message,
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      next(error);
    }
  };
}

/**
 * Validate request parameters against a Zod schema
 * @param schema Zod schema to validate against
 */
export function validateParams(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.params);
      req.params = result as any; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        logger.warn('Parameter validation error', { error: validationError });
        
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: validationError.message,
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      next(error);
    }
  };
}