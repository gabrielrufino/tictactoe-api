import { z } from 'zod';

import { createGameBody, getGameParams, listGamesQuery, makeMoveBody } from '@/shared/schemas/game.schemas.js';

export { createGameBody, getGameParams, listGamesQuery, makeMoveBody } from '@/shared/schemas/game.schemas.js';
export type { CreateGameBody, GetGameParams, ListGamesQuery, MakeMoveBody } from '@/shared/schemas/game.schemas.js';

// Wrapper schemas for validation middleware and OpenAPI compatibility
export const createGameSchema = z.object({
  body: createGameBody,
});

export const makeMoveSchema = z.object({
  params: getGameParams,
  body: makeMoveBody,
});

export const getGameSchema = z.object({
  params: getGameParams,
});

export const listGamesSchema = z.object({
  query: listGamesQuery,
});
