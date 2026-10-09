import { describe, expect, it, vi } from 'vitest';
import { MongoGameRepository } from '@/adapters/repositories/mongo-game.repository.js';
import { Game } from '@/domain/entities/game.entity.js';
import { ConflictError, GameNotFoundError } from '@/domain/errors/game.error.js';

describe(MongoGameRepository.name, () => {
  it('should save a new game successfully', async () => {
    const insertOneMock = vi.fn().mockResolvedValue({});
    const collectionMock: any = {
      insertOne: insertOneMock,
    };

    const repository = new MongoGameRepository(collectionMock);
    const game = Game.create('game-1', 'Alice', 'Bob');

    await repository.save(game);

    expect(insertOneMock).toHaveBeenCalledTimes(1);
    expect(insertOneMock).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'game-1',
        version: 1,
      }),
    );
  });

  it('should throw ConflictError if insertOne encounters duplicate key (11000)', async () => {
    const insertOneMock = vi.fn().mockRejectedValue({ code: 11000 });
    const collectionMock: any = {
      insertOne: insertOneMock,
    };

    const repository = new MongoGameRepository(collectionMock);
    const game = Game.create('game-1', 'Alice', 'Bob');

    await expect(repository.save(game)).rejects.toThrow(ConflictError);
  });

  it('should rethrow unexpected errors on insertOne', async () => {
    const insertOneMock = vi.fn().mockRejectedValue(new Error('DB error'));
    const collectionMock: any = {
      insertOne: insertOneMock,
    };

    const repository = new MongoGameRepository(collectionMock);
    const game = Game.create('game-1', 'Alice', 'Bob');

    await expect(repository.save(game)).rejects.toThrow('DB error');
  });

  it('should update an existing game successfully', async () => {
    const updateOneMock = vi.fn().mockResolvedValue({ matchedCount: 1 });
    const collectionMock: any = {
      updateOne: updateOneMock,
    };

    const repository = new MongoGameRepository(collectionMock);
    const game = new Game({
      id: 'game-1',
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      players: { X: 'Alice', O: 'Bob' },
      turn: 'X',
      status: 'PLAYING',
      winner: null,
      version: 1,
    });

    await repository.save(game);

    expect(updateOneMock).toHaveBeenCalledTimes(1);
    expect(updateOneMock).toHaveBeenCalledWith(
      { _id: 'game-1', version: 1 },
      expect.any(Object),
    );
  });

  it('should throw GameNotFoundError when update fails because game does not exist', async () => {
    const updateOneMock = vi.fn().mockResolvedValue({ matchedCount: 0 });
    const findOneMock = vi.fn().mockResolvedValue(null);
    const collectionMock: any = {
      updateOne: updateOneMock,
      findOne: findOneMock,
    };

    const repository = new MongoGameRepository(collectionMock);
    const game = new Game({
      id: 'game-1',
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      players: { X: 'Alice', O: 'Bob' },
      turn: 'X',
      status: 'PLAYING',
      winner: null,
      version: 1,
    });

    await expect(repository.save(game)).rejects.toThrow(GameNotFoundError);
  });

  it('should throw ConflictError when update fails because version mismatched', async () => {
    const updateOneMock = vi.fn().mockResolvedValue({ matchedCount: 0 });
    const findOneMock = vi.fn().mockResolvedValue({ _id: 'game-1' });
    const collectionMock: any = {
      updateOne: updateOneMock,
      findOne: findOneMock,
    };

    const repository = new MongoGameRepository(collectionMock);
    const game = new Game({
      id: 'game-1',
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      players: { X: 'Alice', O: 'Bob' },
      turn: 'X',
      status: 'PLAYING',
      winner: null,
      version: 1,
    });

    await expect(repository.save(game)).rejects.toThrow(ConflictError);
  });

  it('should find game by id', async () => {
    const findOneMock = vi.fn().mockResolvedValue({
      _id: 'game-1',
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      players: { X: 'Alice', O: 'Bob' },
      turn: 'X',
      status: 'PLAYING',
      winner: null,
      version: 1,
    });
    const collectionMock: any = {
      findOne: findOneMock,
    };

    const repository = new MongoGameRepository(collectionMock);
    const game = await repository.findById('game-1');

    expect(game).toBeInstanceOf(Game);
    expect(game?.id).toBe('game-1');
  });

  it('should return null if game not found by id', async () => {
    const findOneMock = vi.fn().mockResolvedValue(null);
    const collectionMock: any = {
      findOne: findOneMock,
    };

    const repository = new MongoGameRepository(collectionMock);
    const game = await repository.findById('non-existent');

    expect(game).toBeNull();
  });

  it('should find all games with filters and pagination', async () => {
    const toArrayMock = vi.fn().mockResolvedValue([
      {
        _id: 'game-1',
        board: [
          [null, null, null],
          [null, null, null],
          [null, null, null],
        ],
        players: { X: 'Alice', O: 'Bob' },
        turn: 'X',
        status: 'PLAYING',
        winner: null,
        version: 1,
      },
    ]);
    const limitMock = vi.fn().mockReturnValue({ toArray: toArrayMock });
    const skipMock = vi.fn().mockReturnValue({ limit: limitMock });
    const findMock = vi.fn().mockReturnValue({
      skip: skipMock,
      toArray: toArrayMock,
    });
    const collectionMock: any = {
      find: findMock,
    };

    const repository = new MongoGameRepository(collectionMock);
    const games = await repository.findAll({ player: 'Alice', page: 1, limit: 10 });

    expect(findMock).toHaveBeenCalledWith({
      $or: [
        { 'players.X': 'Alice' },
        { 'players.O': 'Alice' },
      ],
    });
    expect(skipMock).toHaveBeenCalledWith(0);
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(games).toHaveLength(1);
    expect(games[0].id).toBe('game-1');
  });

  it('should find all games without filters and pagination', async () => {
    const toArrayMock = vi.fn().mockResolvedValue([]);
    const findMock = vi.fn().mockReturnValue({
      toArray: toArrayMock,
    });
    const collectionMock: any = {
      find: findMock,
    };

    const repository = new MongoGameRepository(collectionMock);
    const games = await repository.findAll();

    expect(findMock).toHaveBeenCalledWith({});
    expect(games).toEqual([]);
  });
});
