import type { MatchmakingEvent, MatchmakingEventPublisher } from '../../use-cases/ports/matchmaking-event.port.js';

export class InMemoryMatchmakingEventPublisher implements MatchmakingEventPublisher {
  private readonly listeners: Set<(event: MatchmakingEvent) => void> = new Set();

  public publish = (event: MatchmakingEvent): void => {
    this.listeners.forEach(listener => listener(event));
  };

  public subscribe = (listener: (event: MatchmakingEvent) => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}
