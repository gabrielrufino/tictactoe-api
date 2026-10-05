import type { LowdbData } from './lowdb-game.repository.js';
import { Low, Memory } from 'lowdb';
import { describe, expect, it } from 'vitest';
import { Game } from '../../domain/entities/game.entity.js';
import { ConflictError, GameNotFoundError } from '../../domain/errors/game.error.js';
import { LowdbGameRepository } from './lowdb-game.repository.js';

describe(LowdbGameRepository.name, () => {
  const createDb = () => {
    const adapter = new Memory<LowdbData>();
    return new Low<LowdbData>(adapter, { games: [] });
  };

  describe('save', () => {
    it('should insert a new game successfully', async () => {
      const db = createDb();
      const repository = new LowdbGameRepository(db);

      const game = Game.create('game-1', 'Alice', 'Bob');
      await repository.save(game);

      const savedGame = await repository.findById('game-1');
      expect(savedGame).not.toBeNull();
      expect(savedGame?.id).toBe('game-1');
      expect(savedGame?.players.X).toBe('Alice');
      expect(savedGame?.players.O).toBe('Bob');
      expect(savedGame?.version).toBe(1);
    });

    it('should throw ConflictError if saving a new game that already exists', async () => {
      const db = createDb();
      const repository = new LowdbGameRepository(db);

      const game1 = Game.create('game-1', 'Alice', 'Bob');
      await repository.save(game1);

      const game2 = Game.create('game-1', 'Charlie', 'David');
      await expect(repository.save(game2)).rejects.toThrow(ConflictError);
    });

    it('should update an existing game successfully', async () => {
      const db = createDb();
      const repository = new LowdbGameRepository(db);

      const game = Game.create('game-1', 'Alice', 'Bob');
      await repository.save(game);

      const loadedGame = await repository.findById('game-1');
      expect(loadedGame).not.toBeNull();

      loadedGame!.makeMove('X', 0, 0);
      await repository.save(loadedGame!);

      const updatedGame = await repository.findById('game-1');
      expect(updatedGame?.board[0][0]).toBe('X');
      expect(updatedGame?.version).toBe(2);
    });

    it('should throw GameNotFoundError when updating a non-existent game', async () => {
      const db = createDb();
      const repository = new LowdbGameRepository(db);

      const game = new Game({
        id: 'non-existent',
        board: [[null, null, null], [null, null, null], [null, null, null]],
        players: { X: 'Alice', O: 'Bob' },
        turn: 'X',
        status: 'PLAYING',
        winner: null,
        version: 1,
      });

      await expect(repository.save(game)).rejects.toThrow(GameNotFoundError);
    });

    it('should throw ConflictError when updating with wrong version (optimistic locking)', async () => {
      const db = createDb();
      const repository = new LowdbGameRepository(db);

      const game = Game.create('game-1', 'Alice', 'Bob');
      await repository.save(game);

      const loaded1 = await repository.findById('game-1');
      const loaded2 = await repository.findById('game-1');

      expect(loaded1?.version).toBe(1);
      expect(loaded2?.version).toBe(1);

      loaded1!.makeMove('X', 0, 0);
      await repository.save(loaded1!);

      loaded2!.makeMove('X', 0, 1);
      await expect(repository.save(loaded2!)).rejects.toThrow(ConflictError);
    });
  });

  describe('findAll', () => {
    it('should return all games when no filter is provided', async () => {
      const db = createDb();
      const repository = new LowdbGameRepository(db);

      await repository.save(Game.create('game-1', 'Alice', 'Bob'));
      await repository.save(Game.create('game-2', 'Charlie', 'David'));

      const games = await repository.findAll();
      expect(games).toHaveLength(2);
      expect(games.map(g => g.id)).toContain('game-1');
      expect(games.map(g => g.id)).toContain('game-2');
    });

    it('should filter games by player', async () => {
      const db = createDb();
      const repository = new LowdbGameRepository(db);

      await repository.save(Game.create('game-1', 'Alice', 'Bob'));
      await repository.save(Game.create('game-2', 'Charlie', 'David'));

      const aliceGames = await repository.findAll({ player: 'Alice' });
      expect(aliceGames).toHaveLength(1);
      expect(aliceGames[0].id).toBe('game-1');

      const charlieGames = await repository.findAll({ player: 'Charlie' });
      expect(charlieGames).toHaveLength(1);
      expect(charlieGames[0].id).toBe('game-2');

      const unknownGames = await repository.findAll({ player: 'Eve' });
      expect(unknownGames).toHaveLength(0);
    });

    it('should apply pagination', async () => {
      const db = createDb();
      const repository = new LowdbGameRepository(db);

      await repository.save(Game.create('game-1', 'Alice', 'P1'));
      await repository.save(Game.create('game-2', 'Alice', 'P2'));
      await repository.save(Game.create('game-3', 'Alice', 'P3'));

      const page1 = await repository.findAll({ player: 'Alice', page: 1, limit: 2 });
      expect(page1).toHaveLength(2);
      expect(page1[0].id).toBe('game-1');
      expect(page1[1].id).toBe('game-2');

      const page2 = await repository.findAll({ player: 'Alice', page: 2, limit: 2 });
      expect(page2).toHaveLength(1);
      expect(page2[0].id).toBe('game-3');
    });
  });
});
