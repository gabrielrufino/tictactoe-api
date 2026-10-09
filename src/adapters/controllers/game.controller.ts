import type { NextFunction, Request, Response } from 'express';
import type { CreateGameBody, GetGameParams, MakeMoveBody } from '@/adapters/controllers/game.validator.js';
import type { CreateGameUseCase } from '@/use-cases/create-game.use-case.js';
import type { GetGameUseCase } from '@/use-cases/get-game.use-case.js';
import type { ListGamesUseCase } from '@/use-cases/list-games.use-case.js';
import type { MakeMoveUseCase } from '@/use-cases/make-move.use-case.js';
import type { GameEventSubscriber } from '@/use-cases/ports/game-event-publisher.port.js';

import { GameMapper } from '@/adapters/controllers/dto/game.mapper.js';

interface AuthenticatedRequest extends Request {
  player?: string
}

export class GameController {
  constructor(
    private readonly createGameUseCase: CreateGameUseCase,
    private readonly makeMoveUseCase: MakeMoveUseCase,
    private readonly getGameUseCase: GetGameUseCase,
    private readonly listGamesUseCase: ListGamesUseCase,
    private readonly gameEventPublisher: GameEventSubscriber,
  ) {}

  public async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateGameBody;
      const game = await this.createGameUseCase.execute({
        playerX: body.playerX,
        playerO: body.playerO,
        authenticatedPlayer: req.player,
      });
      res.status(201).json(GameMapper.toDTO(game));
    }
    catch (error) {
      next(error);
    }
  }

  public async makeMove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.params as GetGameParams;
      const body = req.body as MakeMoveBody;
      const game = await this.makeMoveUseCase.execute({
        gameId: params.id,
        playerSymbol: body.playerSymbol,
        row: Number(body.row),
        col: Number(body.col),
        authenticatedPlayer: req.player,
      });
      res.status(200).json(GameMapper.toDTO(game));
    }
    catch (error) {
      next(error);
    }
  }

  public async getGame(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.params as GetGameParams;
      const game = await this.getGameUseCase.execute({
        gameId: params.id,
        authenticatedPlayer: req.player,
      });
      res.status(200).json(GameMapper.toDTO(game));
    }
    catch (error) {
      next(error);
    }
  }

  public async listGames(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const games = await this.listGamesUseCase.execute({
        player: req.player,
        page: typeof req.query.page === 'string' || typeof req.query.page === 'number' ? Number(req.query.page) : undefined,
        limit: typeof req.query.limit === 'string' || typeof req.query.limit === 'number' ? Number(req.query.limit) : undefined,
      });
      res.status(200).json(games.map(GameMapper.toDTO));
    }
    catch (error) {
      next(error);
    }
  }

  public async getEvents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.params as GetGameParams;
      const gameId = params.id;

      let unsubscribe: (() => void) | undefined;
      let heartbeatInterval: NodeJS.Timeout | undefined;
      let isClosed = false;

      req.on('close', () => {
        isClosed = true;
        if (unsubscribe) {
          unsubscribe();
        }
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      });

      const game = await this.getGameUseCase.execute({
        gameId,
        authenticatedPlayer: req.player,
      });

      if (isClosed) {
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      res.write(`data: ${JSON.stringify(GameMapper.toDTO(game))}\n\n`);

      unsubscribe = this.gameEventPublisher.subscribe(gameId, (updatedGame) => {
        try {
          if (!res.destroyed) {
            res.write(`data: ${JSON.stringify(GameMapper.toDTO(updatedGame))}\n\n`);
          }
        }
        catch {
          // Prevent process crashes on write after connection close
        }
      });

      heartbeatInterval = setInterval(() => {
        try {
          if (!res.destroyed) {
            res.write(':\n\n');
          }
        }
        catch {
          // Prevent process crashes on write after connection close
        }
      }, 15000);
    }
    catch (error) {
      next(error);
    }
  }
}
