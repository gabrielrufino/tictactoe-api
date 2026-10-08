import { describe, expect, it } from 'vitest';
import { MatchmakingQueueImpl } from '@/infrastructure/matchmaking-queue.js';

describe(MatchmakingQueueImpl.name, () => {
  it('should start with empty queue', () => {
    const queue = new MatchmakingQueueImpl();
    expect(queue.getPlayerCount()).toBe(0);
    expect(queue.getWaitingPlayers()).toEqual([]);
  });

  it('should add a player to the queue', () => {
    const queue = new MatchmakingQueueImpl();
    const added = queue.addPlayer('Alice');
    expect(added).toBe(true);
    expect(queue.getPlayerCount()).toBe(1);
    expect(queue.getWaitingPlayers()).toContain('Alice');
    expect(queue.hasPlayer('Alice')).toBe(true);
  });

  it('should not add duplicate players', () => {
    const queue = new MatchmakingQueueImpl();
    queue.addPlayer('Alice');
    const added = queue.addPlayer('Alice');
    expect(added).toBe(false);
    expect(queue.getPlayerCount()).toBe(1);
  });

  it('should remove a player from the queue', () => {
    const queue = new MatchmakingQueueImpl();
    queue.addPlayer('Alice');
    const removed = queue.removePlayer('Alice');
    expect(removed).toBe(true);
    expect(queue.getPlayerCount()).toBe(0);
    expect(queue.hasPlayer('Alice')).toBe(false);
  });

  it('should return false when removing a non-existent player', () => {
    const queue = new MatchmakingQueueImpl();
    expect(queue.removePlayer('Unknown')).toBe(false);
  });

  it('should return the other player', () => {
    const queue = new MatchmakingQueueImpl();
    queue.addPlayer('Alice');
    queue.addPlayer('Bob');
    expect(queue.getOtherPlayer('Alice')).toBe('Bob');
    expect(queue.getOtherPlayer('Bob')).toBe('Alice');
  });

  it('should return null for other player when only one player in queue', () => {
    const queue = new MatchmakingQueueImpl();
    queue.addPlayer('Alice');
    expect(queue.getOtherPlayer('Alice')).toBeNull();
  });
});
