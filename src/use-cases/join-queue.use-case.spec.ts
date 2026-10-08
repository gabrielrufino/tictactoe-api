import type { GameRepository } from '@/domain/repositories/game.repository.js';
import type { IdGenerator } from '@/use-cases/ports/id-generator.port.js';
import type { MatchmakingEvent, MatchmakingEventPublisher, MatchmakingQueue } from '@/use-cases/ports/matchmaking-event.port.js';
import { describe, expect, it, vi } from 'vitest';
import { Game } from '@/domain/entities/game.entity.js';
import { JoinQueueUseCase } from '@/use-cases/join-queue.use-case.js';

function createMockQueue(initialPlayers: string[]) {
  let players = [...initialPlayers];

  const addPlayer = (name: string): boolean => {
    players.push(name);
    return true;
  };

  const removePlayer = (name: string): boolean => {
    players = players.filter(p => p !== name);
    return true;
  };

  return {
    getWaitingPlayers: () => [...players],
    getPlayerCount: () => players.length,
    hasPlayer: (name: string) => players.includes(name),
    addPlayer: vi.fn(addPlayer),
    removePlayer: vi.fn(removePlayer),
    getOtherPlayer: (name: string) => {
      const other = players.find(p => p !== name);
      return other ?? null;
    },
  } as unknown as MatchmakingQueue;
}

function createMockPublisher() {
  const events: MatchmakingEvent[] = [];
  return {
    publish: vi.fn((e: MatchmakingEvent) => { events.push(e); }),
    subscribe: vi.fn() as unknown as (listener: (event: MatchmakingEvent) => void) => () => void,
    getEvents: () => events,
  } as unknown as MatchmakingEventPublisher;
}

describe(JoinQueueUseCase.name, () => {
  it('should add player to queue when no one is waiting', async () => {
    const gameRepository: GameRepository = { save: vi.fn(), findById: vi.fn(), findAll: vi.fn() };
    const idGenerator: IdGenerator = { generate: () => 'game-123' };
    const queue = createMockQueue([]);
    const eventPublisher = createMockPublisher();

    const useCase = new JoinQueueUseCase(gameRepository, idGenerator, queue, eventPublisher);
    const result = await useCase.execute({ playerName: 'Bob' });

    expect(queue.addPlayer).toHaveBeenCalledWith('Bob');
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PLAYER_JOINED', playerName: 'Bob' }),
    );
    expect(result.game).toBeUndefined();
    expect(result.opponentName).toBeUndefined();
  });

  it('should create a game and match players when two are waiting', async () => {
    const savedGames: Game[] = [];
    const gameRepository: GameRepository = {
      save: async (game) => { savedGames.push(game); },
      findById: vi.fn(),
      findAll: vi.fn(),
    };
    const idGenerator: IdGenerator = { generate: () => 'match-456' };
    const queue = createMockQueue(['Alice']);
    const eventPublisher = createMockPublisher();

    const useCase = new JoinQueueUseCase(gameRepository, idGenerator, queue, eventPublisher);
    const result = await useCase.execute({ playerName: 'Bob' });

    expect(result.game!).toBeInstanceOf(Game);
    expect(result.game!.id).toBe('match-456');
    expect(result.game!.players.X).toBe('Alice');
    expect(result.game!.players.O).toBe('Bob');
    expect(result.opponentName).toBe('Alice');
    expect(savedGames).toHaveLength(1);
    expect(savedGames[0].id).toBe('match-456');
    expect(queue.removePlayer).toHaveBeenCalledWith('Alice');
    expect(queue.removePlayer).toHaveBeenCalledWith('Bob');
    expect((eventPublisher as unknown as { getEvents: () => MatchmakingEvent[] }).getEvents().some((e: MatchmakingEvent) => e.type === 'MATCH_FOUND')).toBe(true);
  });

  it('should throw error if playerName is empty', async () => {
    const queue = createMockQueue([]);
    const eventPublisher = createMockPublisher();
    const useCase = new JoinQueueUseCase({} as GameRepository, { generate: () => 'x' } as IdGenerator, queue, eventPublisher);

    await expect(useCase.execute({ playerName: '' })).rejects.toThrow('playerName is required');
  });

  it('should throw error if player is already in queue', async () => {
    const queue = createMockQueue(['Alice']);
    const eventPublisher = createMockPublisher();
    const useCase = new JoinQueueUseCase({} as GameRepository, { generate: () => 'x' } as IdGenerator, queue, eventPublisher);

    await expect(useCase.execute({ playerName: 'Alice' })).rejects.toThrow('Alice is already in the matchmaking queue');
  });
});
