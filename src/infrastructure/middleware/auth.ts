import type { NextFunction, Request, Response } from 'express';
import process from 'node:process';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const expectedToken = process.env.API_TOKEN || 'secret-token';

  if (token !== expectedToken) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }

  next();
}
