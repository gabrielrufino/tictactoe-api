import type { GameRepository } from '../domain/repositories/game.repository.js';
import { describe, expect, it, vi } from 'vitest';
import { Game } from '../domain/entities/game.entity.js';
import { GetGameUseCase } from './get-game.use-case.js';

describe('getGameUseCase', () => {
  it('should retrieve a game by ID and map to DTO', async () => {
    const game = Game.create('game-123', 'Alice', 'Bob');
    const mockFindById = vi.fn().mockResolvedValue(game);
    const repository: GameRepository = {
      save: vi.fn(),
      findById: mockFindById,
      findAll: vi.fn(),
    };

    const useCase = new GetGameUseCase(repository);
    const result = await useCase.execute({ gameId: 'game-123' });

    expect(mockFindById).toHaveBeenCalledWith('game-123');
    expect(result).toBeInstanceOf(Game);
    expect(result.id).toBe('game-123');
    expect(result.players).toEqual({ X: 'Alice', O: 'Bob' });
    expect(result.board).toEqual([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
    expect(result.turn).toBe('X');
    expect(result.status).toBe('PLAYING');
    expect(result.winner).toBeNull();
  });

  it('should throw an error if the game is not found', async () => {
    const mockFindById = vi.fn().mockResolvedValue(null);
    const repository: GameRepository = {
      save: vi.fn(),
      findById: mockFindById,
      findAll: vi.fn(),
    };

    const useCase = new GetGameUseCase(repository);
    await expect(useCase.execute({ gameId: 'invalid-id' })).rejects.toThrow('Game not found');
    expect(mockFindById).toHaveBeenCalledWith('invalid-id');
  });
});
