import type { GameRepository } from '@/domain/repositories/game.repository.js';
import type { IdGenerator } from '@/use-cases/ports/id-generator.port.js';
import { Game } from '@/domain/entities/game.entity.js';
import { ValidationError } from '@/domain/errors/game.error.js';

export interface CreateGameInput {
  readonly playerX: string
  readonly playerO: string
  readonly authenticatedPlayer?: string
}

export class CreateGameUseCase {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  public async execute(input: CreateGameInput): Promise<Game> {
    if (!input.playerX || !input.playerO) {
      throw new ValidationError('Both playerX and playerO are required');
    }

    if (input.playerX === input.playerO) {
      throw new ValidationError('playerX and playerO must be different players');
    }

    if (input.authenticatedPlayer) {
      if (input.authenticatedPlayer !== input.playerX && input.authenticatedPlayer !== input.playerO) {
        throw new ValidationError(
          `Unauthorized: Authenticated player ${input.authenticatedPlayer} must be one of playerX or playerO`,
        );
      }
    }

    const id = this.idGenerator.generate();
    const game = Game.create(id, input.playerX, input.playerO);
    await this.gameRepository.save(game);

    return game;
  }
}
