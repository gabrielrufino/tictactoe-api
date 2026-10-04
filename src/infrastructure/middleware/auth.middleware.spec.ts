import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate } from './auth.middleware.js';

describe('authMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    req = {
      headers: {},
    };
    res = {
      status: statusMock,
    };
    next = vi.fn();
  });

  it('should return 401 if authorization header is missing', () => {
    authenticate(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized: Missing or invalid token format' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header is not Bearer', () => {
    req.headers!.authorization = 'Basic token';
    authenticate(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized: Missing or invalid token format' });
  });

  it('should return 401 if token is invalid', () => {
    req.headers!.authorization = 'Bearer wrong-token';
    authenticate(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid token' });
  });

  it('should call next if token is default secret-token', () => {
    req.headers!.authorization = 'Bearer secret-token';
    authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('should set player name and call next if token starts with player:', () => {
    req.headers!.authorization = 'Bearer player:Alice';
    authenticate(req as Request, res as Response, next);

    expect((req as any).player).toBe('Alice');
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if player: token format is invalid (empty name)', () => {
    req.headers!.authorization = 'Bearer player:';
    authenticate(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid player token format' });
    expect(next).not.toHaveBeenCalled();
  });
});
