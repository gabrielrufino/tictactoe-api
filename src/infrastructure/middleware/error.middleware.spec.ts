import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError, GameNotFoundError } from '../../domain/errors/game.error.js';
import { logger } from '../logger.js';
import { errorHandler } from './error.middleware.js';

vi.mock('../logger.js', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('errorMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    req = {};
    res = {
      status: statusMock,
    };
    next = vi.fn();
  });

  it('should return 404 for GameNotFoundError', () => {
    const error = new GameNotFoundError();
    errorHandler(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Game not found' });
  });

  it('should return 400 for DomainError', () => {
    const error = new DomainError('Some domain validation error');
    errorHandler(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Some domain validation error' });
  });

  it('should log the error and return 500 for a generic/unknown Error', () => {
    const error = new Error('Database connection failed');
    errorHandler(error, req as Request, res as Response, next);

    expect(logger.error).toHaveBeenCalledWith(error, 'Unhandled application error: Database connection failed');
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Database connection failed' });
  });

  it('should return 500 with default message if error has no message', () => {
    const error = { name: 'Error', message: '' } as unknown as Error;
    errorHandler(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'An unexpected error occurred' });
  });
});
