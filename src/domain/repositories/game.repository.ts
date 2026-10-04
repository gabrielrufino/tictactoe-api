import type { Game } from '../entities/game.js';

export interface GameRepository {
  save: (game: Game) => Promise<void>
  findById: (id: string) => Promise<Game | null>
  findAll: (filter?: { player?: string, page?: number, limit?: number }) => Promise<Game[]>
}
