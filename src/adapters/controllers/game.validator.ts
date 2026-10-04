import { z } from 'zod';

export const createGameSchema = z.object({
  body: z.object({
    playerX: z.string().min(1, 'playerX is required'),
    playerO: z.string().min(1, 'playerO is required'),
  }),
});

export const makeMoveSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'id is required'),
  }),
  body: z.object({
    playerSymbol: z.enum(['X', 'O']),
    row: z.coerce.number().int().min(0, 'row must be at least 0').max(2, 'row must be at most 2'),
    col: z.coerce.number().int().min(0, 'col must be at least 0').max(2, 'col must be at most 2'),
  }),
});

export const getGameSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'id is required'),
  }),
});

export const listGamesSchema = z.object({
  query: z.object({
    player: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
});

export type CreateGameSchemaType = typeof createGameSchema;
export type MakeMoveSchemaType = typeof makeMoveSchema;
export type GetGameSchemaType = typeof getGameSchema;
export type ListGamesSchemaType = typeof listGamesSchema;
