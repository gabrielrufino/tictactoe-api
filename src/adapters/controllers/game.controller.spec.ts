import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameController } from './game.controller.js';

describe('gameController', () => {
  let createGameUseCaseMock: any;
  let makeMoveUseCaseMock: any;
  let getGameUseCaseMock: any;
  let listGamesUseCaseMock: any;
  let controller: GameController;

  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    createGameUseCaseMock = { execute: vi.fn() };
    makeMoveUseCaseMock = { execute: vi.fn() };
    getGameUseCaseMock = { execute: vi.fn() };
    listGamesUseCaseMock = { execute: vi.fn() };

    controller = new GameController(
      createGameUseCaseMock,
      makeMoveUseCaseMock,
      getGameUseCaseMock,
      listGamesUseCaseMock,
    );

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: statusMock,
      json: jsonMock,
    };
    next = vi.fn();
  });

  describe('create', () => {
    it('should create a game and return 201', async () => {
      req.body = { playerX: 'Alice', playerO: 'Bob' };
      const expectedGame = { id: 'game-123', players: { X: 'Alice', O: 'Bob' } };
      createGameUseCaseMock.execute.mockResolvedValue(expectedGame);

      await controller.create(req as Request, res as Response, next);

      expect(createGameUseCaseMock.execute).toHaveBeenCalledWith({ playerX: 'Alice', playerO: 'Bob' });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expectedGame);
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
      (req as any).player = 'Alice';
      const expectedGame = { id: 'game-123', turn: 'O' };
      makeMoveUseCaseMock.execute.mockResolvedValue(expectedGame);

      await controller.makeMove(req as Request, res as Response, next);

      expect(makeMoveUseCaseMock.execute).toHaveBeenCalledWith({
        gameId: 'game-123',
        playerSymbol: 'X',
        row: 1,
        col: 2,
        authenticatedPlayer: 'Alice',
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expectedGame);
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
      const expectedGame = { id: 'game-123' };
      getGameUseCaseMock.execute.mockResolvedValue(expectedGame);

      await controller.getGame(req as Request, res as Response, next);

      expect(getGameUseCaseMock.execute).toHaveBeenCalledWith({ gameId: 'game-123' });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expectedGame);
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
      const expectedGames = [{ id: 'game-123' }];
      listGamesUseCaseMock.execute.mockResolvedValue(expectedGames);

      await controller.listGames(req as Request, res as Response, next);

      expect(listGamesUseCaseMock.execute).toHaveBeenCalledWith({
        player: 'Alice',
        page: 1,
        limit: 10,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expectedGames);
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
});
