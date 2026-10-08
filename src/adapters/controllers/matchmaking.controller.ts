import type { NextFunction, Request, Response } from 'express';

import type { JoinQueueUseCase } from '@/use-cases/join-queue.use-case.js';
import type { LeaveQueueUseCase } from '@/use-cases/leave-queue.use-case.js';
import type { MatchmakingEvent, MatchmakingEventPublisher, MatchmakingQueue } from '@/use-cases/ports/matchmaking-event.port.js';
import { GameMapper } from '@/adapters/controllers/dto/game.mapper.js';

export class MatchmakingController {
  constructor(
    private readonly joinQueueUseCase: JoinQueueUseCase,
    private readonly leaveQueueUseCase: LeaveQueueUseCase,
    private readonly queue: MatchmakingQueue,
    private readonly eventPublisher: MatchmakingEventPublisher,
  ) {}

  public async join(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playerName = req.body.playerName;
      const result = await this.joinQueueUseCase.execute({ playerName });

      if (result.game) {
        res.status(201).json({
          message: 'Match found!',
          game: GameMapper.toDTO(result.game),
          opponentName: result.opponentName,
        });
      }
      else {
        res.status(202).json({
          message: 'Added to matchmaking queue',
          queuePosition: this.queue.getPlayerCount(),
        });
      }
    }
    catch (error) {
      next(error);
    }
  }

  public async leave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playerName = req.body.playerName;
      await this.leaveQueueUseCase.execute({ playerName });
      res.status(200).json({ message: 'Left matchmaking queue' });
    }
    catch (error) {
      next(error);
    }
  }

  public async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includePlayers = (req as any).query?.includePlayers ?? false;
      const players = this.queue.getWaitingPlayers();
      const response: { waitingPlayers?: string[], playerCount: number } = { playerCount: players.length };
      if (includePlayers) {
        response.waitingPlayers = players;
      }
      res.status(200).json(response);
    }
    catch (error) {
      next(error);
    }
  }

  public async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let unsubscribe: (() => void) | undefined;
      let heartbeatInterval: NodeJS.Timeout | undefined;

      req.on('close', () => {
        unsubscribe?.();
        heartbeatInterval && clearInterval(heartbeatInterval);
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const listener = (event: MatchmakingEvent) => {
        try {
          if (!res.destroyed) {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          }
        }
        catch {
          // prevent crash on write after close
        }
      };

      unsubscribe = this.eventPublisher.subscribe(listener);

      heartbeatInterval = setInterval(() => {
        try {
          if (!res.destroyed) {
            res.write(':\n\n');
          }
        }
        catch {
          // prevent crash on write after close
        }
      }, 15000);
    }
    catch (error) {
      next(error);
    }
  }
}
