import type { Game } from '../domain/entities/game.entity.js';
import type { GameRepository } from '../domain/repositories/game.repository.js';
import { GameNotFoundError } from '../domain/errors/game.error.js';

export interface GetGameInput {
  readonly gameId: string
}

export class GetGameUseCase {
  constructor(private readonly gameRepository: GameRepository) {}

  public async execute(input: GetGameInput): Promise<Game> {
    const game = await this.gameRepository.findById(input.gameId);
    if (!game) {
      throw new GameNotFoundError();
    }

    return game;
  }
}
