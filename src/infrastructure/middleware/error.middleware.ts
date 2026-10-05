import type { NextFunction, Request, Response } from 'express';
import { DomainError, GameNotFoundError } from '../../domain/errors/game.error.js';
import { logger } from '../logger.js';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof GameNotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }

  if (error instanceof DomainError) {
    res.status(400).json({ error: error.message });
    return;
  }

  // Log unknown/system errors
  logger.error(error, `Unhandled application error: ${error.message}`);

  res.status(500).json({ error: 'An unexpected error occurred' });
}
