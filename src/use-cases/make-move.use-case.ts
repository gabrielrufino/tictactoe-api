import type { Game, PlayerSymbol } from '../domain/entities/game.entity.js';
import type { GameRepository } from '../domain/repositories/game.repository.js';
import type { GameEventPublisher } from './ports/game-event-publisher.port.js';
import { GameNotFoundError, ValidationError } from '../domain/errors/game.error.js';

export interface MakeMoveInput {
  readonly gameId: string
  readonly playerSymbol: PlayerSymbol
  readonly row: number
  readonly col: number
  readonly authenticatedPlayer?: string
}

export class MakeMoveUseCase {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly gameEventPublisher: GameEventPublisher,
  ) {}

  public async execute(input: MakeMoveInput): Promise<Game> {
    const game = await this.gameRepository.findById(input.gameId);
    if (!game) {
      throw new GameNotFoundError();
    }

    if (input.authenticatedPlayer) {
      const expectedPlayer = input.playerSymbol === 'X' ? game.players.X : game.players.O;
      if (input.authenticatedPlayer !== expectedPlayer) {
        throw new ValidationError(
          `Unauthorized: Authenticated player is ${input.authenticatedPlayer}, but symbol ${input.playerSymbol} belongs to ${expectedPlayer}`,
        );
      }
    }

    game.makeMove(input.playerSymbol, input.row, input.col);
    await this.gameRepository.save(game);

    this.gameEventPublisher.publish(input.gameId, game);

    return game;
  }
}
