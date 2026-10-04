import type { Game } from '../../domain/entities/game.entity.js';
import type { GameResponseDTO } from './game-response.dto.js';

export class GameMapper {
  public static toDTO(game: Game): GameResponseDTO {
    return {
      id: game.id,
      board: [
        [game.board[0][0], game.board[0][1], game.board[0][2]],
        [game.board[1][0], game.board[1][1], game.board[1][2]],
        [game.board[2][0], game.board[2][1], game.board[2][2]],
      ],
      players: {
        X: game.players.X,
        O: game.players.O,
      },
      turn: game.turn,
      status: game.status,
      winner: game.winner,
    };
  }
}
