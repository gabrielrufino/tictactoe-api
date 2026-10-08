import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate } from '@/infrastructure/middleware/auth.middleware.js';

process.env.API_TOKEN = 'secret-token';

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

  it('should set player name and call next if token is a valid signed player token', () => {
    const signature = crypto
      .createHmac('sha256', 'secret-token')
      .update('Alice')
      .digest('hex');
    req.headers!.authorization = `Bearer player:Alice:${signature}`;
    authenticate(req as Request, res as Response, next);

    expect((req as any).player).toBe('Alice');
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if player: token has no signature', () => {
    req.headers!.authorization = 'Bearer player:Alice';
    authenticate(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid player token format' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if player: token has invalid signature', () => {
    req.headers!.authorization = 'Bearer player:Alice:wrong-signature';
    authenticate(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid player signature' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if player: token format is invalid (empty name)', () => {
    req.headers!.authorization = 'Bearer player::some-sig';
    authenticate(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid player token format' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 500 if API_TOKEN is not configured', () => {
    const originalToken = process.env.API_TOKEN;
    delete process.env.API_TOKEN;
    req.headers!.authorization = 'Bearer secret-token';
    authenticate(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal Server Error: API_TOKEN is not configured' });
    expect(next).not.toHaveBeenCalled();
    process.env.API_TOKEN = originalToken;
  });
});
