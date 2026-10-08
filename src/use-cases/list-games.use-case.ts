import type { Game } from '@/domain/entities/game.entity.js';
import type { GameRepository } from '@/domain/repositories/game.repository.js';

export interface ListGamesRequestDTO {
  player?: string
  page?: number
  limit?: number
}

export class ListGamesUseCase {
  constructor(private readonly gameRepository: GameRepository) {}

  public async execute(request?: ListGamesRequestDTO): Promise<readonly Game[]> {
    const page = request?.page ?? 1;
    const limit = request?.limit ?? 10;
    const games = await this.gameRepository.findAll({
      player: request?.player,
      page,
      limit,
    });
    return games;
  }
}
