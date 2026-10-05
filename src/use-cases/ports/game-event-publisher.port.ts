import type { Game } from '../../domain/entities/game.entity.js';

export interface GameEventPublisher {
  publish: (gameId: string, game: Game) => void
}

export interface GameEventSubscriber {
  subscribe: (gameId: string, listener: (game: Game) => void) => () => void
}
