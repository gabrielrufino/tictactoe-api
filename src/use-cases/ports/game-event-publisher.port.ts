import type { GameResponseDTO } from '../dto/game-response.dto.js';

export interface GameEventPublisher {
  publish: (gameId: string, game: GameResponseDTO) => void
}

export interface GameEventSubscriber {
  subscribe: (gameId: string, listener: (game: GameResponseDTO) => void) => () => void
}
