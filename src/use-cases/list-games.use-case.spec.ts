import type { GameRepository } from '@/domain/repositories/game.repository.js';
import { describe, expect, it, vi } from 'vitest';
import { Game } from '@/domain/entities/game.entity.js';
import { ListGamesUseCase } from '@/use-cases/list-games.use-case.js';

describe(ListGamesUseCase.name, () => {
  it('should list games with default page and limit', async () => {
    const game1 = Game.create('game-1', 'Alice', 'Bob');
    const game2 = Game.create('game-2', 'Charlie', 'David');
    const mockFindAll = vi.fn().mockResolvedValue([game1, game2]);
    const repository: GameRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: mockFindAll,
    };

    const useCase = new ListGamesUseCase(repository);
    const result = await useCase.execute();

    expect(mockFindAll).toHaveBeenCalledWith({
      player: undefined,
      page: 1,
      limit: 10,
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('game-1');
    expect(result[1].id).toBe('game-2');
  });

  it('should list games filtered by player and custom pagination', async () => {
    const game = Game.create('game-1', 'Alice', 'Bob');
    const mockFindAll = vi.fn().mockResolvedValue([game]);
    const repository: GameRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: mockFindAll,
    };

    const useCase = new ListGamesUseCase(repository);
    const result = await useCase.execute({
      player: 'Alice',
      page: 2,
      limit: 5,
    });

    expect(mockFindAll).toHaveBeenCalledWith({
      player: 'Alice',
      page: 2,
      limit: 5,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('game-1');
  });
});
