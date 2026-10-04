import type { PlayerSymbol } from '../domain/entities/game.js';
import type { GameRepository } from '../domain/repositories/game-repository.js';
import type { GameResponseDTO } from './dto/game-response-dto.js';
import { GameMapper } from './dto/game-mapper.js';

export interface MakeMoveInput {
  readonly gameId: string
  readonly playerSymbol: PlayerSymbol
  readonly row: number
  readonly col: number
}

export class MakeMoveUseCase {
  constructor(private readonly gameRepository: GameRepository) {}

  public async execute(input: MakeMoveInput): Promise<GameResponseDTO> {
    const game = await this.gameRepository.findById(input.gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.makeMove(input.playerSymbol, input.row, input.col);
    await this.gameRepository.save(game);

    return GameMapper.toDTO(game);
  }
}
