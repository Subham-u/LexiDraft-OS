import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from './error';

export const validateRequest = (schema: AnyZodObject | { schema: AnyZodObject }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const zodSchema = 'schema' in schema ? schema.schema : schema;
      await zodSchema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(ApiError.badRequest('Validation error', error.errors));
      } else {
        next(error);
      }
    }
  };
}; 