import type { Game } from '@/domain/entities/game.entity.js';

export interface GameRepository {
  save: (game: Game) => Promise<void>
  findById: (id: string) => Promise<Game | null>
  findAll: (filter?: { player?: string, page?: number, limit?: number }) => Promise<Game[]>
}
