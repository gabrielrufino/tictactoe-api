import type { MatchmakingEvent, MatchmakingEventPublisher, MatchmakingQueue } from '@/use-cases/ports/matchmaking-event.port.js';
import { describe, expect, it, vi } from 'vitest';
import { LeaveQueueUseCase } from '@/use-cases/leave-queue.use-case.js';

function createMockQueue(initialPlayers: string[]) {
  let players = [...initialPlayers];

  const removePlayer = (name: string): boolean => {
    players = players.filter(p => p !== name);
    return true;
  };

  return {
    getWaitingPlayers: () => [...players],
    getPlayerCount: () => players.length,
    hasPlayer: (name: string) => players.includes(name),
    addPlayer: vi.fn(),
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

describe(LeaveQueueUseCase.name, () => {
  it('should remove player from queue and publish PLAYER_LEFT event', async () => {
    const queue = createMockQueue(['Alice', 'Bob']);
    const eventPublisher = createMockPublisher();

    const useCase = new LeaveQueueUseCase(queue, eventPublisher);
    await useCase.execute({ playerName: 'Alice' });

    expect(queue.removePlayer).toHaveBeenCalledWith('Alice');
    expect((eventPublisher as unknown as { getEvents: () => MatchmakingEvent[] }).getEvents().some((e: MatchmakingEvent) => e.type === 'PLAYER_LEFT' && e.playerName === 'Alice')).toBe(true);
  });

  it('should publish QUEUE_EMPTY when last player leaves', async () => {
    const queue = createMockQueue(['Alice']);
    const eventPublisher = createMockPublisher();

    const useCase = new LeaveQueueUseCase(queue, eventPublisher);
    await useCase.execute({ playerName: 'Alice' });

    expect((eventPublisher as unknown as { getEvents: () => MatchmakingEvent[] }).getEvents().some((e: MatchmakingEvent) => e.type === 'QUEUE_EMPTY')).toBe(true);
  });

  it('should throw error if player is not in queue', async () => {
    const queue = createMockQueue([]);
    const eventPublisher = createMockPublisher();
    const useCase = new LeaveQueueUseCase(queue, eventPublisher);

    await expect(useCase.execute({ playerName: 'Unknown' })).rejects.toThrow('Unknown is not in the matchmaking queue');
  });

  it('should throw error if playerName is empty', async () => {
    const queue = createMockQueue([]);
    const eventPublisher = createMockPublisher();
    const useCase = new LeaveQueueUseCase(queue, eventPublisher);

    await expect(useCase.execute({ playerName: '' })).rejects.toThrow('playerName is required');
  });
});
