import type { NextFunction, Request, Response } from 'express';
import type { Mock, Mocked } from 'vitest';
import type { CreateGameUseCase } from '../../use-cases/create-game.use-case.js';
import type { GetGameUseCase } from '../../use-cases/get-game.use-case.js';
import type { ListGamesUseCase } from '../../use-cases/list-games.use-case.js';
import type { MakeMoveUseCase } from '../../use-cases/make-move.use-case.js';
import type { GameEventSubscriber } from '../../use-cases/ports/game-event-publisher.port.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Game } from '../../domain/entities/game.entity.js';
import { GameMapper } from './dto/game.mapper.js';
import { GameController } from './game.controller.js';

describe(GameController.name, () => {
  let createGameUseCaseMock: Mocked<CreateGameUseCase>;
  let makeMoveUseCaseMock: Mocked<MakeMoveUseCase>;
  let getGameUseCaseMock: Mocked<GetGameUseCase>;
  let listGamesUseCaseMock: Mocked<ListGamesUseCase>;
  let gameEventPublisherMock: Mocked<GameEventSubscriber>;
  let controller: GameController;

  let req: Partial<Request> & { player?: string };
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: Mock;
  let statusMock: Mock;

  beforeEach(() => {
    createGameUseCaseMock = { execute: vi.fn() } as unknown as Mocked<CreateGameUseCase>;
    makeMoveUseCaseMock = { execute: vi.fn() } as unknown as Mocked<MakeMoveUseCase>;
    getGameUseCaseMock = { execute: vi.fn() } as unknown as Mocked<GetGameUseCase>;
    listGamesUseCaseMock = { execute: vi.fn() } as unknown as Mocked<ListGamesUseCase>;
    gameEventPublisherMock = { subscribe: vi.fn() } as unknown as Mocked<GameEventSubscriber>;

    controller = new GameController(
      createGameUseCaseMock,
      makeMoveUseCaseMock,
      getGameUseCaseMock,
      listGamesUseCaseMock,
      gameEventPublisherMock,
    );

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    req = {
      body: {},
      params: {},
      query: {},
      on: vi.fn(),
    };
    res = {
      status: statusMock,
      json: jsonMock,
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
    };
    next = vi.fn();
  });

  describe('create', () => {
    it('should create a game and return 201', async () => {
      req.body = { playerX: 'Alice', playerO: 'Bob' };
      const game = Game.create('game-123', 'Alice', 'Bob');
      createGameUseCaseMock.execute.mockResolvedValue(game);

      await controller.create(req as Request, res as Response, next);

      expect(createGameUseCaseMock.execute).toHaveBeenCalledWith({ playerX: 'Alice', playerO: 'Bob' });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(GameMapper.toDTO(game));
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if execute throws', async () => {
      req.body = { playerX: 'Alice', playerO: 'Bob' };
      const error = new Error('Some error');
      createGameUseCaseMock.execute.mockRejectedValue(error);

      await controller.create(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('makeMove', () => {
    it('should make a move and return 200', async () => {
      req.params = { id: 'game-123' };
      req.body = { playerSymbol: 'X', row: 1, col: 2 };
      req.player = 'Alice';
      const game = Game.create('game-123', 'Alice', 'Bob');
      game.makeMove('X', 1, 2);
      makeMoveUseCaseMock.execute.mockResolvedValue(game);

      await controller.makeMove(req as Request, res as Response, next);

      expect(makeMoveUseCaseMock.execute).toHaveBeenCalledWith({
        gameId: 'game-123',
        playerSymbol: 'X',
        row: 1,
        col: 2,
        authenticatedPlayer: 'Alice',
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(GameMapper.toDTO(game));
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if execute throws', async () => {
      req.params = { id: 'game-123' };
      req.body = { playerSymbol: 'X', row: 1, col: 2 };
      const error = new Error('Some error');
      makeMoveUseCaseMock.execute.mockRejectedValue(error);

      await controller.makeMove(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getGame', () => {
    it('should return 200 with the game', async () => {
      req.params = { id: 'game-123' };
      const game = Game.create('game-123', 'Alice', 'Bob');
      getGameUseCaseMock.execute.mockResolvedValue(game);

      await controller.getGame(req as Request, res as Response, next);

      expect(getGameUseCaseMock.execute).toHaveBeenCalledWith({ gameId: 'game-123' });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(GameMapper.toDTO(game));
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if execute throws', async () => {
      req.params = { id: 'game-123' };
      const error = new Error('Some error');
      getGameUseCaseMock.execute.mockRejectedValue(error);

      await controller.getGame(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('listGames', () => {
    it('should return 200 with the games list', async () => {
      req.query = { player: 'Alice', page: '1', limit: '10' };
      const game = Game.create('game-123', 'Alice', 'Bob');
      const expectedGames = [game];
      listGamesUseCaseMock.execute.mockResolvedValue(expectedGames);

      await controller.listGames(req as Request, res as Response, next);

      expect(listGamesUseCaseMock.execute).toHaveBeenCalledWith({
        player: 'Alice',
        page: 1,
        limit: 10,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expectedGames.map(GameMapper.toDTO));
      expect(next).not.toHaveBeenCalled();
    });

    it('should call listGamesUseCase with undefined parameters if query is empty', async () => {
      req.query = {};
      listGamesUseCaseMock.execute.mockResolvedValue([]);

      await controller.listGames(req as Request, res as Response, next);

      expect(listGamesUseCaseMock.execute).toHaveBeenCalledWith({
        player: undefined,
        page: undefined,
        limit: undefined,
      });
    });

    it('should call next with error if execute throws', async () => {
      req.query = {};
      const error = new Error('Some error');
      listGamesUseCaseMock.execute.mockRejectedValue(error);

      await controller.listGames(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getEvents', () => {
    it('should set headers, send initial state, subscribe, and unsubscribe on close', async () => {
      req.params = { id: 'game-123' };
      const game = Game.create('game-123', 'Alice', 'Bob');
      getGameUseCaseMock.execute.mockResolvedValue(game);

      const mockUnsubscribe = vi.fn();
      gameEventPublisherMock.subscribe.mockReturnValue(mockUnsubscribe);

      await controller.getEvents(req as Request, res as Response, next);

      expect(getGameUseCaseMock.execute).toHaveBeenCalledWith({ gameId: 'game-123' });

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.flushHeaders).toHaveBeenCalled();

      expect(res.write).toHaveBeenCalledWith(`data: ${JSON.stringify(GameMapper.toDTO(game))}\n\n`);

      expect(gameEventPublisherMock.subscribe).toHaveBeenCalledWith('game-123', expect.any(Function));

      const listenerCallback = gameEventPublisherMock.subscribe.mock.calls[0][1];
      const updatedGame = Game.create('game-123', 'Alice', 'Bob');
      updatedGame.makeMove('X', 0, 0);
      listenerCallback(updatedGame);
      expect(res.write).toHaveBeenCalledWith(`data: ${JSON.stringify(GameMapper.toDTO(updatedGame))}\n\n`);

      expect(req.on).toHaveBeenCalledWith('close', expect.any(Function));
      const closeCallback = (req.on as Mock).mock.calls.find(call => call[0] === 'close')?.[1];
      if (closeCallback) {
        closeCallback();
      }
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should call next with error if getGameUseCase throws', async () => {
      req.params = { id: 'game-123' };
      const error = new Error('Game not found');
      getGameUseCaseMock.execute.mockRejectedValue(error);

      await controller.getEvents(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.setHeader).not.toHaveBeenCalled();
    });
  });
});
