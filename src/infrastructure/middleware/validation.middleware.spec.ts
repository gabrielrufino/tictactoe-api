import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '@/infrastructure/middleware/validation.middleware.js';

describe('validationMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    req = {
      body: {},
      query: {},
      params: {},
    };
    res = {
      status: statusMock,
    };
    next = vi.fn();
  });

  it('should successfully parse valid data and call next', async () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
      }),
    });

    req.body = { name: 'Alice' };

    const middleware = validate(schema);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'Alice' });
  });

  it('should return 400 with formatted error messages on ZodError', async () => {
    const schema = z.object({
      body: z.object({
        name: z.string().min(1, 'Name is required'),
      }),
    });

    req.body = { name: '' };

    const middleware = validate(schema);
    await middleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Validation failed: name: Name is required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with error if a non-ZodError is thrown', async () => {
    const schema = {
      parseAsync: vi.fn().mockRejectedValue(new Error('Unexpected parse error')),
    } as any;

    const middleware = validate(schema);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(statusMock).not.toHaveBeenCalled();
  });
});
