import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const createGameSchema = z.object({
  body: z.object({
    playerX: z.string().min(1, 'playerX is required').openapi({ example: 'Alice', description: 'Name of player X' }),
    playerO: z.string().min(1, 'playerO is required').openapi({ example: 'Bob', description: 'Name of player O' }),
  }),
});

export const makeMoveSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'id is required').openapi({ description: 'The game ID', example: '6ac1ba8f1d76b9830719ee7a' }),
  }),
  body: z.object({
    playerSymbol: z.enum(['X', 'O']).openapi({ description: 'Symbol of the player making the move' }),
    row: z.coerce.number().int().min(0, 'row must be at least 0').max(2, 'row must be at most 2').openapi({ example: 1, description: 'Row index (0-2)' }),
    col: z.coerce.number().int().min(0, 'col must be at least 0').max(2, 'col must be at most 2').openapi({ example: 1, description: 'Column index (0-2)' }),
  }),
});

export const getGameSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'id is required').openapi({ description: 'The game ID', example: '6ac1ba8f1d76b9830719ee7a' }),
  }),
});

export const listGamesSchema = z.object({
  query: z.object({
    player: z.string().optional().openapi({ description: 'Filter games where this player is participating (either X or O)', example: 'Alice' }),
    page: z.coerce.number().int().positive().optional().openapi({ description: 'Page number for pagination', default: 1, example: 1 }),
    limit: z.coerce.number().int().positive().optional().openapi({ description: 'Number of games per page', default: 10, example: 10 }),
  }),
});

export type CreateGameSchemaType = typeof createGameSchema;
export type MakeMoveSchemaType = typeof makeMoveSchema;
export type GetGameSchemaType = typeof getGameSchema;
export type ListGamesSchemaType = typeof listGamesSchema;
