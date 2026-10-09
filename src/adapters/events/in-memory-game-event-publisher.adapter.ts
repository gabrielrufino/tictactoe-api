import type { Game } from '@/domain/entities/game.entity.js';
import type { GameEventPublisher, GameEventSubscriber } from '@/use-cases/ports/game-event-publisher.port.js';
import { EventEmitter } from 'node:events';

export class InMemoryGameEventPublisher implements GameEventPublisher, GameEventSubscriber {
  private readonly emitter = new EventEmitter();

  public publish = (gameId: string, game: Game): void => {
    this.emitter.emit(`game:${gameId}`, game);
  };

  public subscribe = (gameId: string, listener: (game: Game) => void): () => void => {
    this.emitter.on(`game:${gameId}`, listener);
    return () => {
      this.emitter.off(`game:${gameId}`, listener);
    };
  };
}
