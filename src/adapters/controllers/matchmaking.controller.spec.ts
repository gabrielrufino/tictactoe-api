import type { NextFunction, Request, Response } from 'express';
import type { Mock, Mocked } from 'vitest';
import type { JoinQueueUseCase } from '@/use-cases/join-queue.use-case.js';
import type { LeaveQueueUseCase } from '@/use-cases/leave-queue.use-case.js';
import type { MatchmakingEventPublisher, MatchmakingQueue } from '@/use-cases/ports/matchmaking-event.port.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameMapper } from '@/adapters/controllers/dto/game.mapper.js';
import { MatchmakingController } from '@/adapters/controllers/matchmaking.controller.js';
import { Game } from '@/domain/entities/game.entity.js';

describe(MatchmakingController.name, () => {
  let joinQueueUseCaseMock: Mocked<JoinQueueUseCase>;
  let leaveQueueUseCaseMock: Mocked<LeaveQueueUseCase>;
  let queueMock: Mocked<MatchmakingQueue>;
  let eventPublisherMock: Mocked<MatchmakingEventPublisher>;
  let controller: MatchmakingController;

  let req: Partial<Request> & { player?: string };
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: Mock;
  let statusMock: Mock;

  beforeEach(() => {
    joinQueueUseCaseMock = { execute: vi.fn() } as unknown as Mocked<JoinQueueUseCase>;
    leaveQueueUseCaseMock = { execute: vi.fn() } as unknown as Mocked<LeaveQueueUseCase>;
    queueMock = { getWaitingPlayers: vi.fn(), getPlayerCount: vi.fn(), hasPlayer: vi.fn(), addPlayer: vi.fn(), removePlayer: vi.fn() } as unknown as Mocked<MatchmakingQueue>;
    eventPublisherMock = { publish: vi.fn(), subscribe: vi.fn() } as unknown as Mocked<MatchmakingEventPublisher>;

    controller = new MatchmakingController(
      joinQueueUseCaseMock,
      leaveQueueUseCaseMock,
      queueMock,
      eventPublisherMock,
    );

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    req = {
      body: {},
      params: {},
      query: {},
      on: vi.fn(),
      player: 'Alice',
    };
    res = {
      status: statusMock,
      json: jsonMock,
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      destroyed: false,
    } as unknown as Response;
    next = vi.fn();
  });

  describe('join', () => {
    it('should return 202 when added to queue', async () => {
      joinQueueUseCaseMock.execute.mockResolvedValue({});
      queueMock.getPlayerCount.mockReturnValue(1);

      req.body = { playerName: 'Alice' };
      await controller.join(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(202);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Added to matchmaking queue',
        queuePosition: 1,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 201 with game when match is found', async () => {
      const game = Game.create('match-1', 'Alice', 'Bob');
      joinQueueUseCaseMock.execute.mockResolvedValue({ game, opponentName: 'Bob' });

      req.body = { playerName: 'Bob' };
      await controller.join(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Match found!',
        game: GameMapper.toDTO(game),
        opponentName: 'Bob',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      joinQueueUseCaseMock.execute.mockRejectedValue(new Error('Already in queue'));
      req.body = { playerName: 'Alice' };

      await controller.join(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('leave', () => {
    it('should return 200 when player leaves queue', async () => {
      leaveQueueUseCaseMock.execute.mockResolvedValue(undefined);
      req.body = { playerName: 'Alice' };

      await controller.leave(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Left matchmaking queue' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      leaveQueueUseCaseMock.execute.mockRejectedValue(new Error('Not in queue'));
      req.body = { playerName: 'Unknown' };

      await controller.leave(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getStatus', () => {
    it('should return queue status without player names by default', async () => {
      queueMock.getWaitingPlayers.mockReturnValue(['Alice', 'Bob']);
      queueMock.getPlayerCount.mockReturnValue(2);

      await controller.getStatus(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        playerCount: 2,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should include player names when includePlayers is true', async () => {
      queueMock.getWaitingPlayers.mockReturnValue(['Alice', 'Bob']);
      queueMock.getPlayerCount.mockReturnValue(2);
      req.query = { includePlayers: true };

      await controller.getStatus(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        waitingPlayers: ['Alice', 'Bob'],
        playerCount: 2,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getEvents', () => {
    it('should set SSE headers and subscribe to events', async () => {
      const unsubscribe = vi.fn();
      eventPublisherMock.subscribe.mockReturnValue(unsubscribe);

      await controller.getEvents(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.flushHeaders).toHaveBeenCalled();
      expect(eventPublisherMock.subscribe).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });
});
