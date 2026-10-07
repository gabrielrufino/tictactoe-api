import type { GameRepository } from '../domain/repositories/game.repository.js';
import type { IdGenerator } from './ports/id-generator.port.js';
import type { MatchmakingEventPublisher, MatchmakingQueue } from './ports/matchmaking-event.port.js';
import { Game } from '../domain/entities/game.entity.js';
import { ValidationError } from '../domain/errors/game.error.js';

export interface JoinQueueInput {
  readonly playerName: string
}

export class JoinQueueUseCase {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly idGenerator: IdGenerator,
    private readonly queue: MatchmakingQueue,
    private readonly eventPublisher: MatchmakingEventPublisher,
  ) {}

  public async execute(input: JoinQueueInput): Promise<{ game?: ReturnType<typeof Game.create>, opponentName?: string }> {
    const { playerName } = input;

    if (!playerName) {
      throw new ValidationError('playerName is required');
    }

    if (this.queue.hasPlayer(playerName)) {
      throw new ValidationError(`${playerName} is already in the matchmaking queue`);
    }

    this.queue.addPlayer(playerName);

    this.eventPublisher.publish({
      type: 'PLAYER_JOINED',
      playerName,
      timestamp: new Date().toISOString(),
    });

    if (this.queue.getPlayerCount() === 2) {
      const players = this.queue.getWaitingPlayers();
      const playerX = players[0];
      const playerO = players[1];
      const opponentName = players.find(p => p !== playerName) ?? '';

      this.queue.removePlayer(playerX);
      this.queue.removePlayer(playerO);

      const id = this.idGenerator.generate();
      const game = Game.create(id, playerX, playerO);
      await this.gameRepository.save(game);

      this.eventPublisher.publish({
        type: 'MATCH_FOUND',
        playerName: playerX,
        opponentName: playerO,
        gameId: id,
        timestamp: new Date().toISOString(),
      });

      return { game, opponentName };
    }

    return {};
  }
}
