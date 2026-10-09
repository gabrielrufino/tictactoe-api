import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const joinQueueBody = z.object({
  playerName: z.string().min(1, 'playerName is required').openapi({ description: 'Name of the player joining the queue', example: 'Alice' }),
});

export type JoinQueueBody = z.input<typeof joinQueueBody>;

export const leaveQueueBody = z.object({
  playerName: z.string().min(1, 'playerName is required').openapi({ description: 'Name of the player leaving the queue', example: 'Alice' }),
});

export type LeaveQueueBody = z.input<typeof leaveQueueBody>;

export const getStatusQuery = z.object({
  includePlayers: z.enum(['true', 'false']).optional().transform(val => val === 'true').openapi({ description: 'Include waiting player names', default: false }),
});

export type GetStatusQuery = z.input<typeof getStatusQuery>;
