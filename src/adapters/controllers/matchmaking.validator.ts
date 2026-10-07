import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const joinQueueSchema = z.object({
  body: z.object({
    playerName: z.string().min(1, 'playerName is required').openapi({ description: 'Name of the player joining the queue', example: 'Alice' }),
  }),
});

export const leaveQueueSchema = z.object({
  body: z.object({
    playerName: z.string().min(1, 'playerName is required').openapi({ description: 'Name of the player leaving the queue', example: 'Alice' }),
  }),
});

export const getMatchmakingStatusSchema = z.object({
  query: z.object({
    includePlayers: z.preprocess(
      val => val === 'true' ? true : val === 'false' ? false : val,
      z.boolean().optional(),
    ).openapi({ description: 'Include waiting player names', default: false }),
  }),
});

export type JoinQueueSchemaType = typeof joinQueueSchema;
export type LeaveQueueSchemaType = typeof leaveQueueSchema;
export type GetMatchmakingStatusSchemaType = typeof getMatchmakingStatusSchema;
