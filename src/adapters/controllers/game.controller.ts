import type { NextFunction, Request, Response } from 'express';
import type { CreateGameUseCase } from '../../usecases/create-game.use-case.js';
import type { GetGameUseCase } from '../../usecases/get-game.use-case.js';
import type { ListGamesUseCase } from '../../usecases/list-games.use-case.js';
import type { MakeMoveUseCase } from '../../usecases/make-move.use-case.js';

export class GameController {
  constructor(
    private readonly createGameUseCase: CreateGameUseCase,
    private readonly makeMoveUseCase: MakeMoveUseCase,
    private readonly getGameUseCase: GetGameUseCase,
    private readonly listGamesUseCase: ListGamesUseCase,
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { playerX, playerO } = req.body;
      const game = await this.createGameUseCase.execute({ playerX, playerO });
      res.status(201).json(game);
    }
    catch (error) {
      next(error);
    }
  };

  public makeMove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      res.status(200).json(game);
    }
    catch (error) {
      next(error);
    }
  };

  public getGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const game = await this.getGameUseCase.execute({ gameId: String(id) });
      res.status(200).json(game);
    }
    catch (error) {
      next(error);
    }
  };

  public listGames = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { player, page, limit } = req.query;
      const games = await this.listGamesUseCase.execute({
        player: player ? String(player) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json(games);
    }
    catch (error) {
      next(error);
    }
  };
}
