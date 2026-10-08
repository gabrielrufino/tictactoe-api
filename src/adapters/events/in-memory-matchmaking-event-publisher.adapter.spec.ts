import { describe, expect, it, vi } from 'vitest';
import { InMemoryMatchmakingEventPublisher } from '@/adapters/events/in-memory-matchmaking-event-publisher.adapter.js';

describe(InMemoryMatchmakingEventPublisher.name, () => {
  it('should publish events to subscribed listeners', () => {
    const publisher = new InMemoryMatchmakingEventPublisher();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    publisher.subscribe(listener1);
    publisher.subscribe(listener2);

    const event = { type: 'MATCH_FOUND' as const, gameId: 'game-1', playerX: 'Alice', playerO: 'Bob', timestamp: new Date().toISOString() };
    publisher.publish(event);

    expect(listener1).toHaveBeenCalledWith(event);
    expect(listener2).toHaveBeenCalledWith(event);
  });

  it('should allow unsubscribing listeners', () => {
    const publisher = new InMemoryMatchmakingEventPublisher();
    const listener = vi.fn();

    const unsubscribe = publisher.subscribe(listener);
    unsubscribe();

    const event = { type: 'MATCH_FOUND' as const, gameId: 'game-1', playerX: 'Alice', playerO: 'Bob', timestamp: new Date().toISOString() };
    publisher.publish(event);

    expect(listener).not.toHaveBeenCalled();
  });
});
