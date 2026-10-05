import { describe, expect, it, vi } from 'vitest';
import { InMemoryGameEventPublisher } from './in-memory-game-event-publisher.adapter.js';

describe('inMemoryGameEventPublisher', () => {
  it('should allow subscribing and publishing to a specific game', () => {
    const publisher = new InMemoryGameEventPublisher();
    const listener = vi.fn();

    const unsubscribe = publisher.subscribe('game-123', listener);

    const gameData = { id: 'game-123' } as any;
    publisher.publish('game-123', gameData);

    expect(listener).toHaveBeenCalledWith(gameData);

    unsubscribe();
  });

  it('should not receive events after unsubscribing', () => {
    const publisher = new InMemoryGameEventPublisher();
    const listener = vi.fn();

    const unsubscribe = publisher.subscribe('game-123', listener);
    unsubscribe();

    const gameData = { id: 'game-123' } as any;
    publisher.publish('game-123', gameData);

    expect(listener).not.toHaveBeenCalled();
  });

  it('should not deliver events to other game subscriptions', () => {
    const publisher = new InMemoryGameEventPublisher();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    publisher.subscribe('game-123', listener1);
    publisher.subscribe('game-456', listener2);

    const gameData = { id: 'game-123' } as any;
    publisher.publish('game-123', gameData);

    expect(listener1).toHaveBeenCalledWith(gameData);
    expect(listener2).not.toHaveBeenCalled();
  });
});
