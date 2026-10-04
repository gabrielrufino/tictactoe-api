import type { Collection } from 'mongodb';
import type { Board, GameStatus, PlayerSymbol } from '../../domain/entities/game.entity.js';
import type { GameRepository } from '../../domain/repositories/game.repository.js';
import { Game } from '../../domain/entities/game.entity.js';
import { ConflictError, GameNotFoundError } from '../../domain/errors/game.error.js';

export interface GameDocument {
  _id: string
  board: Board
  players: {
    X: string
    O: string
  }
  turn: PlayerSymbol
  status: GameStatus
  winner: PlayerSymbol | null
  version?: number
  updatedAt?: Date
}

export class MongoGameRepository implements GameRepository {
  constructor(private readonly collection: Collection<GameDocument>) {}

  public async save(game: Game): Promise<void> {
    const isNew = game.version === 0;

    if (isNew) {
      try {
        await this.collection.insertOne({
          _id: game.id,
          board: game.board,
          players: game.players,
          turn: game.turn,
          status: game.status,
          winner: game.winner,
          version: 1,
          updatedAt: new Date(),
        });
      }
      catch (error: any) {
        if (error.code === 11000) {
          throw new ConflictError('Game already exists');
        }
        throw error;
      }
    }
    else {
      const result = await this.collection.updateOne(
        { _id: game.id, version: game.version },
        {
          $set: {
            board: game.board,
            players: game.players,
            turn: game.turn,
            status: game.status,
            winner: game.winner,
            updatedAt: new Date(),
          },
          $inc: { version: 1 },
        },
      );

      if (result.matchedCount === 0) {
        const exists = await this.collection.findOne({ _id: game.id });
        if (!exists) {
          throw new GameNotFoundError();
        }
        throw new ConflictError();
      }
    }
  }

  public async findById(id: string): Promise<Game | null> {
    const doc = await this.collection.findOne({ _id: id });
    if (!doc) {
      return null;
    }

    return new Game({
      id: doc._id,
      board: doc.board,
      players: doc.players,
      turn: doc.turn,
      status: doc.status,
      winner: doc.winner,
      version: doc.version,
    });
  }

  public async findAll(filter?: { player?: string, page?: number, limit?: number }): Promise<Game[]> {
    const query = filter?.player
      ? {
          $or: [
            { 'players.X': filter.player },
            { 'players.O': filter.player },
          ],
        }
      : {};

    let cursor = this.collection.find(query);

    if (filter?.page !== undefined && filter?.limit !== undefined) {
      const skip = (filter.page - 1) * filter.limit;
      cursor = cursor.skip(skip).limit(filter.limit);
    }

    const docs = await cursor.toArray();
    return docs.map(
      doc =>
        new Game({
          id: doc._id,
          board: doc.board,
          players: doc.players,
          turn: doc.turn,
          status: doc.status,
          winner: doc.winner,
          version: doc.version,
        }),
    );
  }
}
