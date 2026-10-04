import type { GameRepository } from '../domain/repositories/game.repository.js';
import type { GameEventPublisher } from './ports/game-event-publisher.port.js';
import { describe, expect, it, vi } from 'vitest';
import { Game } from '../domain/entities/game.entity.js';
import { MakeMoveUseCase } from './make-move.use-case.js';

describe('makeMoveUseCase', () => {
  it('should successfully make a move and save the game', async () => {
    const game = Game.create('game-123', 'Alice', 'Bob');
    const mockFindById = vi.fn().mockResolvedValue(game);
    const mockSave = vi.fn();
    const repository: GameRepository = {
      save: mockSave,
      findById: mockFindById,
      findAll: vi.fn(),
    };
    const mockPublisher: GameEventPublisher = {
      publish: vi.fn(),
    };

    const useCase = new MakeMoveUseCase(repository, mockPublisher);
    const result = await useCase.execute({
      gameId: 'game-123',
      playerSymbol: 'X',
      row: 0,
      col: 0,
    });

    expect(mockFindById).toHaveBeenCalledWith('game-123');
    expect(mockSave).toHaveBeenCalledWith(game);
    expect(mockPublisher.publish).toHaveBeenCalledWith('game-123', result);
    expect(result.board[0][0]).toBe('X');
    expect(result.turn).toBe('O');
  });

  it('should throw an error if the game is not found', async () => {
    const mockFindById = vi.fn().mockResolvedValue(null);
    const repository: GameRepository = {
      save: vi.fn(),
      findById: mockFindById,
      findAll: vi.fn(),
    };
    const mockPublisher: GameEventPublisher = {
      publish: vi.fn(),
    };

    const useCase = new MakeMoveUseCase(repository, mockPublisher);
    await expect(
      useCase.execute({
        gameId: 'invalid-id',
        playerSymbol: 'X',
        row: 0,
        col: 0,
      }),
    ).rejects.toThrow('Game not found');
  });

  it('should successfully make a move if authenticatedPlayer matches the expected player for the symbol', async () => {
    const game = Game.create('game-123', 'Alice', 'Bob');
    const mockFindById = vi.fn().mockResolvedValue(game);
    const mockSave = vi.fn();
    const repository: GameRepository = {
      save: mockSave,
      findById: mockFindById,
      findAll: vi.fn(),
    };
    const mockPublisher: GameEventPublisher = {
      publish: vi.fn(),
    };

    const useCase = new MakeMoveUseCase(repository, mockPublisher);
    const result = await useCase.execute({
      gameId: 'game-123',
      playerSymbol: 'X',
      row: 0,
      col: 0,
      authenticatedPlayer: 'Alice',
    });

    expect(result.board[0][0]).toBe('X');
    expect(mockPublisher.publish).toHaveBeenCalledWith('game-123', result);
  });

  it('should throw ValidationError if authenticatedPlayer does not match the expected player for the symbol', async () => {
    const game = Game.create('game-123', 'Alice', 'Bob');
    const mockFindById = vi.fn().mockResolvedValue(game);
    const repository: GameRepository = {
      save: vi.fn(),
      findById: mockFindById,
      findAll: vi.fn(),
    };
    const mockPublisher: GameEventPublisher = {
      publish: vi.fn(),
    };

    const useCase = new MakeMoveUseCase(repository, mockPublisher);
    await expect(
      useCase.execute({
        gameId: 'game-123',
        playerSymbol: 'X',
        row: 0,
        col: 0,
        authenticatedPlayer: 'Bob',
      }),
    ).rejects.toThrow('Unauthorized: Authenticated player is Bob, but symbol X belongs to Alice');
    expect(mockPublisher.publish).not.toHaveBeenCalled();
  });
});
