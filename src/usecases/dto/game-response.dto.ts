import type { Board, GameStatus, PlayerSymbol } from '../../domain/entities/game.js';

export interface GameResponseDTO {
  readonly id: string
  readonly board: Board
  readonly players: {
    readonly X: string
    readonly O: string
  }
  readonly turn: PlayerSymbol
  readonly status: GameStatus
  readonly winner: PlayerSymbol | null
}
