import { z } from 'zod';

import { getStatusQuery, joinQueueBody, leaveQueueBody } from '@/shared/schemas/matchmaking.schemas.js';

export { getStatusQuery, joinQueueBody, leaveQueueBody } from '@/shared/schemas/matchmaking.schemas.js';
export type { GetStatusQuery, JoinQueueBody, LeaveQueueBody } from '@/shared/schemas/matchmaking.schemas.js';

// Wrapper schemas for validation middleware and OpenAPI compatibility
export const joinQueueSchema = z.object({
  body: joinQueueBody,
});

export const leaveQueueSchema = z.object({
  body: leaveQueueBody,
});

export const getMatchmakingStatusSchema = z.object({
  query: getStatusQuery,
});
