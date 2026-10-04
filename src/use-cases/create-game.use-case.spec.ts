import type { GameRepository } from '../domain/repositories/game.repository.js';
import type { IdGenerator } from './ports/id-generator.port.js';
import { describe, expect, it, vi } from 'vitest';
import { Game } from '../domain/entities/game.entity.js';
import { CreateGameUseCase } from './create-game.use-case.js';

describe('createGameUseCase', () => {
  it('should create a game and save it in repository', async () => {
    const mockSave = vi.fn();
    const repository: GameRepository = {
      save: mockSave,
      findById: vi.fn(),
      findAll: vi.fn(),
    };
    const idGenerator: IdGenerator = {
      generate: () => 'game-123',
    };

    const useCase = new CreateGameUseCase(repository, idGenerator);
    const result = await useCase.execute({ playerX: 'Alice', playerO: 'Bob' });

    expect(mockSave).toHaveBeenCalledTimes(1);
    const savedGame = mockSave.mock.calls[0][0];
    expect(savedGame).toBeInstanceOf(Game);
    expect(savedGame.id).toBe('game-123');
    expect(savedGame.players.X).toBe('Alice');
    expect(savedGame.players.O).toBe('Bob');

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

  it('should throw an error if playerX is missing', async () => {
    const repository: GameRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
    };
    const idGenerator: IdGenerator = {
      generate: () => 'game-123',
    };

    const useCase = new CreateGameUseCase(repository, idGenerator);
    await expect(useCase.execute({ playerX: '', playerO: 'Bob' })).rejects.toThrow(
      'Both playerX and playerO are required',
    );
  });

  it('should throw an error if playerO is missing', async () => {
    const repository: GameRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
    };
    const idGenerator: IdGenerator = {
      generate: () => 'game-123',
    };

    const useCase = new CreateGameUseCase(repository, idGenerator);
    await expect(useCase.execute({ playerX: 'Alice', playerO: '' })).rejects.toThrow(
      'Both playerX and playerO are required',
    );
  });

  it('should throw an error if playerX and playerO are the same player', async () => {
    const repository: GameRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
    };
    const idGenerator: IdGenerator = {
      generate: () => 'game-123',
    };

    const useCase = new CreateGameUseCase(repository, idGenerator);
    await expect(useCase.execute({ playerX: 'Alice', playerO: 'Alice' })).rejects.toThrow(
      'playerX and playerO must be different players',
    );
  });
});
