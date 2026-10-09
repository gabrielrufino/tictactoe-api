import type { GameRepository } from '@/domain/repositories/game.repository.js';
import type { IdGenerator } from '@/use-cases/ports/id-generator.port.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '@/domain/entities/game.entity.js';
import { CreateGameUseCase } from '@/use-cases/create-game.use-case.js';
import { GetGameUseCase } from '@/use-cases/get-game.use-case.js';
import { ListGamesUseCase } from '@/use-cases/list-games.use-case.js';
import { MakeMoveUseCase } from '@/use-cases/make-move.use-case.js';

// In-Memory Implementations for testing
class InMemoryGameRepository implements GameRepository {
  private games = new Map<string, Game>();

  async save(game: Game): Promise<void> {
    this.games.set(game.id, game);
  }

  async findById(id: string): Promise<Game | null> {
    const game = this.games.get(id);
    if (!game)
      return null;
    // Return a new instance to simulate fetching/reconstitution
    return new Game({
      id: game.id,
      board: [
        [game.board[0][0], game.board[0][1], game.board[0][2]],
        [game.board[1][0], game.board[1][1], game.board[1][2]],
        [game.board[2][0], game.board[2][1], game.board[2][2]],
      ],
      players: { ...game.players },
      turn: game.turn,
      status: game.status,
      winner: game.winner,
    });
  }

  async findAll(filter?: { player?: string, page?: number, limit?: number }): Promise<Game[]> {
    let allGames = Array.from(this.games.values());
    if (filter?.player) {
      allGames = allGames.filter(
        game => game.players.X === filter.player || game.players.O === filter.player,
      );
    }
    if (filter?.page !== undefined && filter?.limit !== undefined) {
      const skip = (filter.page - 1) * filter.limit;
      allGames = allGames.slice(skip, skip + filter.limit);
    }
    return allGames;
  }
}

class SimpleIdGenerator implements IdGenerator {
  private counter = 0;
  generate(): string {
    this.counter += 1;
    return `id-${this.counter}`;
  }
}

describe('use Cases Integration', () => {
  let repository: GameRepository;
  let idGenerator: IdGenerator;
  let createGame: CreateGameUseCase;
  let getGame: GetGameUseCase;
  let makeMove: MakeMoveUseCase;
  let listGames: ListGamesUseCase;

  beforeEach(() => {
    repository = new InMemoryGameRepository();
    idGenerator = new SimpleIdGenerator();
    createGame = new CreateGameUseCase(repository, idGenerator);
    getGame = new GetGameUseCase(repository);
    const mockPublisher = { publish: () => {} };
    makeMove = new MakeMoveUseCase(repository, mockPublisher);
    listGames = new ListGamesUseCase(repository);
  });

  it('should play a game from start to finish', async () => {
    // 1. Create a game
    const gameDTO = await createGame.execute({ playerX: 'Alice', playerO: 'Bob' });
    expect(gameDTO.id).toBe('id-1');
    expect(gameDTO.players.X).toBe('Alice');
    expect(gameDTO.players.O).toBe('Bob');
    expect(gameDTO.status).toBe('PLAYING');

    // 2. Make move 1: X plays (0,0)
    let updated = await makeMove.execute({
      gameId: 'id-1',
      playerSymbol: 'X',
      row: 0,
      col: 0,
    });
    expect(updated.board[0][0]).toBe('X');
    expect(updated.turn).toBe('O');

    // 3. Make move 2: O plays (1,1)
    updated = await makeMove.execute({
      gameId: 'id-1',
      playerSymbol: 'O',
      row: 1,
      col: 1,
    });
    expect(updated.board[1][1]).toBe('O');
    expect(updated.turn).toBe('X');

    // 4. Retrieve game via GetGame
    const fetched = await getGame.execute({ gameId: 'id-1' });
    expect(fetched.board[0][0]).toBe('X');
    expect(fetched.board[1][1]).toBe('O');

    // 5. List all games
    const gamesList = await listGames.execute();
    expect(gamesList.length).toBe(1);
    expect(gamesList[0].id).toBe('id-1');
  });

  it('should throw error if game does not exist', async () => {
    await expect(getGame.execute({ gameId: 'invalid-id' })).rejects.toThrow('Game not found');
  });

  it('should throw error if playerX or playerO is empty', async () => {
    await expect(createGame.execute({ playerX: '', playerO: 'Bob' })).rejects.toThrow('Both playerX and playerO are required');
    await expect(createGame.execute({ playerX: 'Alice', playerO: '' })).rejects.toThrow('Both playerX and playerO are required');
  });

  it('should throw error if game does not exist when making a move', async () => {
    await expect(makeMove.execute({ gameId: 'invalid-id', playerSymbol: 'X', row: 0, col: 0 })).rejects.toThrow('Game not found');
  });

  it('should list games filtered by player', async () => {
    await createGame.execute({ playerX: 'Alice', playerO: 'Bob' });
    await createGame.execute({ playerX: 'Charlie', playerO: 'David' });

    const aliceGames = await listGames.execute({ player: 'Alice' });
    expect(aliceGames.length).toBe(1);
    expect(aliceGames[0].players.X).toBe('Alice');

    const bobGames = await listGames.execute({ player: 'Bob' });
    expect(bobGames.length).toBe(1);
    expect(bobGames[0].players.O).toBe('Bob');

    const charlieGames = await listGames.execute({ player: 'Charlie' });
    expect(charlieGames.length).toBe(1);
    expect(charlieGames[0].players.X).toBe('Charlie');

    const nonExistentGames = await listGames.execute({ player: 'NonExistent' });
    expect(nonExistentGames.length).toBe(0);

    const allGames = await listGames.execute();
    expect(allGames.length).toBe(2);
  });

  it('should list games with pagination', async () => {
    await createGame.execute({ playerX: 'Alice', playerO: 'Bob' });
    await createGame.execute({ playerX: 'Charlie', playerO: 'David' });
    await createGame.execute({ playerX: 'Eve', playerO: 'Frank' });

    // Page 1 with limit 2
    const page1 = await listGames.execute({ page: 1, limit: 2 });
    expect(page1.length).toBe(2);
    expect(page1[0].players.X).toBe('Alice');
    expect(page1[1].players.X).toBe('Charlie');

    // Page 2 with limit 2
    const page2 = await listGames.execute({ page: 2, limit: 2 });
    expect(page2.length).toBe(1);
    expect(page2[0].players.X).toBe('Eve');

    // Page 3 with limit 2
    const page3 = await listGames.execute({ page: 3, limit: 2 });
    expect(page3.length).toBe(0);
  });
});
