import type { Low } from 'lowdb';
import type { Board, GameStatus, PlayerSymbol } from '../../domain/entities/game.entity.js';
import type { GameRepository } from '../../domain/repositories/game.repository.js';
import { Game } from '../../domain/entities/game.entity.js';
import { ConflictError, GameNotFoundError } from '../../domain/errors/game.error.js';

export interface LowdbGameDocument {
  _id: string
  board: Board
  players: {
    X: string
    O: string
  }
  turn: PlayerSymbol
  status: GameStatus
  winner: PlayerSymbol | null
  version: number
  updatedAt: string
}

export interface LowdbData {
  games: LowdbGameDocument[]
}

export class LowdbGameRepository implements GameRepository {
  constructor(private readonly db: Low<LowdbData>) {}

  public async save(game: Game): Promise<void> {
    await this.db.read();

    const isNew = game.version === 0;

    if (isNew) {
      const exists = this.db.data.games.some(g => g._id === game.id);
      if (exists) {
        throw new ConflictError('Game already exists');
      }

      this.db.data.games.push({
        _id: game.id,
        board: game.board,
        players: game.players,
        turn: game.turn,
        status: game.status,
        winner: game.winner,
        version: 1,
        updatedAt: new Date().toISOString(),
      });
    }
    else {
      const index = this.db.data.games.findIndex(g => g._id === game.id);
      if (index === -1) {
        throw new GameNotFoundError();
      }

      const existingGame = this.db.data.games[index];
      if (existingGame.version !== game.version) {
        throw new ConflictError();
      }

      this.db.data.games[index] = {
        _id: game.id,
        board: game.board,
        players: game.players,
        turn: game.turn,
        status: game.status,
        winner: game.winner,
        version: game.version + 1,
        updatedAt: new Date().toISOString(),
      };
    }

    await this.db.write();
  }

  public async findById(id: string): Promise<Game | null> {
    await this.db.read();
    const doc = this.db.data.games.find(g => g._id === id);
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
    await this.db.read();

    let filteredGames = this.db.data.games;

    if (filter?.player) {
      const player = filter.player;
      filteredGames = filteredGames.filter(
        g => g.players.X === player || g.players.O === player,
      );
    }

    if (filter?.page !== undefined && filter?.limit !== undefined) {
      const skip = (filter.page - 1) * filter.limit;
      filteredGames = filteredGames.slice(skip, skip + filter.limit);
    }

    return filteredGames.map(
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
