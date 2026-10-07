import type { NextFunction, Request, Response } from 'express';
import type { CreateGuestTokenUseCase } from '../../use-cases/create-guest-token.use-case.js';

export class AuthController {
  constructor(private readonly createGuestTokenUseCase: CreateGuestTokenUseCase) {}

  public async createGuestToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body || {};
      const name = body.name;

      const result = this.createGuestTokenUseCase.execute({ name });

      res.status(201).json({
        token: result.token,
        name: result.name,
        bearer: `Bearer ${result.token}`,
      });
    }
    catch (error) {
      next(error);
    }
  }
}
