import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import process from 'node:process';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;

  if (!authHeader?.startsWith('Bearer ') && !queryToken) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    return;
  }

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : queryToken!;
  const expectedToken = process.env.API_TOKEN;

  if (!expectedToken) {
    res.status(500).json({ error: 'Internal Server Error: API_TOKEN is not configured' });
    return;
  }

  if (token.startsWith('player:')) {
    const parts = token.split(':');
    const playerId = parts[1];
    const signature = parts[2];

    if (!playerId || !signature) {
      res.status(401).json({ error: 'Unauthorized: Invalid player token format' });
      return;
    }

    const expectedSignature = crypto
      .createHmac('sha256', expectedToken)
      .update(playerId)
      .digest('hex');

    if (signature !== expectedSignature) {
      res.status(401).json({ error: 'Unauthorized: Invalid player signature' });
      return;
    }

    (req as any).player = playerId;
  }
  else if (token !== expectedToken) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }

  next();
}
