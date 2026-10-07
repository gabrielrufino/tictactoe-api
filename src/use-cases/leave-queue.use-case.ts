import type { MatchmakingEventPublisher, MatchmakingQueue } from './ports/matchmaking-event.port.js';
import { ValidationError } from '../domain/errors/game.error.js';

export interface LeaveQueueInput {
  readonly playerName: string
}

export class LeaveQueueUseCase {
  constructor(
    private readonly queue: MatchmakingQueue,
    private readonly eventPublisher: MatchmakingEventPublisher,
  ) {}

  public async execute(input: LeaveQueueInput): Promise<void> {
    const { playerName } = input;

    if (!playerName) {
      throw new ValidationError('playerName is required');
    }

    if (!this.queue.hasPlayer(playerName)) {
      throw new ValidationError(`${playerName} is not in the matchmaking queue`);
    }

    this.queue.removePlayer(playerName);

    this.eventPublisher.publish({
      type: 'PLAYER_LEFT',
      playerName,
      timestamp: new Date().toISOString(),
    });

    if (this.queue.getPlayerCount() === 0) {
      this.eventPublisher.publish({
        type: 'QUEUE_EMPTY',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
