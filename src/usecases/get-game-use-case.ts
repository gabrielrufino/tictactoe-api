import type { GameRepository } from '../domain/repositories/game-repository.js';
import type { GameResponseDTO } from './dto/game-response-dto.js';
import { GameMapper } from './dto/game-mapper.js';

export interface GetGameInput {
  readonly gameId: string
}

export class GetGameUseCase {
  constructor(private readonly gameRepository: GameRepository) {}

  public async execute(input: GetGameInput): Promise<GameResponseDTO> {
    const game = await this.gameRepository.findById(input.gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    return GameMapper.toDTO(game);
  }
}
