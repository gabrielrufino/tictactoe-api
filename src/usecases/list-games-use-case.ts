import type { GameRepository } from '../domain/repositories/game-repository.js';
import type { GameResponseDTO } from './dto/game-response-dto.js';
import { GameMapper } from './dto/game-mapper.js';

export interface ListGamesRequestDTO {
  player?: string
  page?: number
  limit?: number
}

export class ListGamesUseCase {
  constructor(private readonly gameRepository: GameRepository) {}

  public async execute(request?: ListGamesRequestDTO): Promise<readonly GameResponseDTO[]> {
    const page = request?.page ?? 1;
    const limit = request?.limit ?? 10;
    const games = await this.gameRepository.findAll({
      player: request?.player,
      page,
      limit,
    });
    return games.map(GameMapper.toDTO);
  }
}
