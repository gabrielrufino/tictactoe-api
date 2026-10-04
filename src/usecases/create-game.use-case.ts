import type { GameRepository } from '../domain/repositories/game-repository.js';
import type { GameResponseDTO } from './dto/game-response-dto.js';
import type { IdGenerator } from './ports/id-generator.js';
import { Game } from '../domain/entities/game.js';
import { GameMapper } from './dto/game-mapper.js';

export interface CreateGameInput {
  readonly playerX: string
  readonly playerO: string
}

export class CreateGameUseCase {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  public async execute(input: CreateGameInput): Promise<GameResponseDTO> {
    if (!input.playerX || !input.playerO) {
      throw new Error('Both playerX and playerO are required');
    }

    const id = this.idGenerator.generate();
    const game = Game.create(id, input.playerX, input.playerO);
    await this.gameRepository.save(game);

    return GameMapper.toDTO(game);
  }
}
