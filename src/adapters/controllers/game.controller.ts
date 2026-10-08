import type { NextFunction, Request, Response } from 'express';
import type { CreateGameUseCase } from '@/use-cases/create-game.use-case.js';
import type { GetGameUseCase } from '@/use-cases/get-game.use-case.js';
import type { ListGamesUseCase } from '@/use-cases/list-games.use-case.js';
import type { MakeMoveUseCase } from '@/use-cases/make-move.use-case.js';
import type { GameEventSubscriber } from '@/use-cases/ports/game-event-publisher.port.js';
import { GameMapper } from '@/adapters/controllers/dto/game.mapper.js';

export class GameController {
  constructor(
    private readonly createGameUseCase: CreateGameUseCase,
    private readonly makeMoveUseCase: MakeMoveUseCase,
    private readonly getGameUseCase: GetGameUseCase,
    private readonly listGamesUseCase: ListGamesUseCase,
    private readonly gameEventPublisher: GameEventSubscriber,
  ) {}

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { playerX, playerO } = req.body;
      const game = await this.createGameUseCase.execute({
        playerX,
        playerO,
        authenticatedPlayer: (req as any).player,
      });
      res.status(201).json(GameMapper.toDTO(game));
    }
    catch (error) {
      next(error);
    }
  }

  public async makeMove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { playerSymbol, row, col } = req.body;
      const game = await this.makeMoveUseCase.execute({
        gameId: String(id),
        playerSymbol,
        row: Number(row),
        col: Number(col),
        authenticatedPlayer: (req as any).player,
      });
      res.status(200).json(GameMapper.toDTO(game));
    }
    catch (error) {
      next(error);
    }
  }

  public async getGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const game = await this.getGameUseCase.execute({
        gameId: String(id),
        authenticatedPlayer: (req as any).player,
      });
      res.status(200).json(GameMapper.toDTO(game));
    }
    catch (error) {
      next(error);
    }
  }

  public async listGames(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { player, page, limit } = req.query;
      const games = await this.listGamesUseCase.execute({
        player: (req as any).player ?? (player ? String(player) : undefined),
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json(games.map(GameMapper.toDTO));
    }
    catch (error) {
      next(error);
    }
  }

  public async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const gameId = String(id);

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
        authenticatedPlayer: (req as any).player,
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
