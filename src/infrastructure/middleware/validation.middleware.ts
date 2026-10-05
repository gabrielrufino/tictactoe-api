import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as any;
      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        Object.assign(req.query, parsed.query);
      }
      if (parsed.params !== undefined) {
        Object.assign(req.params, parsed.params);
      }
      next();
    }
    catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues || [];
        const errorMessages = issues.map((err) => {
          const path = err.path.slice(1).join('.');
          return path ? `${path}: ${err.message}` : err.message;
        }).join(', ');

        res.status(400).json({
          error: `Validation failed: ${errorMessages}`,
        });
        return;
      }
      next(error);
    }
  };
}
