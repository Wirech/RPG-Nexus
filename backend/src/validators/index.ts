import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => e.message).join(', ');
        res.status(400).json({
          error: true,
          message: messages,
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
}
