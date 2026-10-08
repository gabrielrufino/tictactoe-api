import type { NextFunction, Request, Response } from 'express';
import type { CreateGuestTokenUseCase } from '@/use-cases/create-guest-token.use-case.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from '@/adapters/controllers/auth.controller.js';

describe('authController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: any;
  let statusMock: any;
  let createGuestTokenUseCase: Partial<CreateGuestTokenUseCase>;
  let authController: AuthController;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    req = { body: {} };
    res = { status: statusMock };
    next = vi.fn();

    createGuestTokenUseCase = {
      execute: vi.fn().mockReturnValue({
        token: 'player:Alice:mock-signature',
        name: 'Alice',
      }),
    };

    authController = new AuthController(createGuestTokenUseCase as CreateGuestTokenUseCase);
  });

  it('should create a guest token successfully and return 201', async () => {
    req.body = { name: 'Alice' };

    await authController.createGuestToken(req as Request, res as Response, next);

    expect(createGuestTokenUseCase.execute).toHaveBeenCalledWith({ name: 'Alice' });
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      token: 'player:Alice:mock-signature',
      name: 'Alice',
      bearer: 'Bearer player:Alice:mock-signature',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle errors thrown by use case', async () => {
    const error = new Error('Database or config error');
    (createGuestTokenUseCase.execute as any).mockImplementation(() => {
      throw error;
    });

    await authController.createGuestToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
