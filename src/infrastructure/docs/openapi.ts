import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { guestTokenSchema } from '@/adapters/controllers/auth.validator.js';
import {
  createGameSchema,
  getGameSchema,
  listGamesSchema,
  makeMoveSchema,
} from '@/adapters/controllers/game.validator.js';

const registry = new OpenAPIRegistry();

// 1. Security Schemes
registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  description: 'Bearer token validation. Use `secret-token` or `player:<playerName>`.',
});

// 2. Reusable Schemas
const GameStatusSchema = registry.register(
  'GameStatus',
  z.enum(['PLAYING', 'WON', 'DRAW']),
);

const PlayerSymbolSchema = registry.register(
  'PlayerSymbol',
  z.enum(['X', 'O']),
);

const BoardCellSchema = registry.register(
  'BoardCell',
  z.enum(['X', 'O']).nullable(),
);

const BoardSchema = registry.register(
  'Board',
  z.array(
    z.array(BoardCellSchema).min(3).max(3),
  ).min(3).max(3),
);

const GameResponseSchema = registry.register(
  'GameResponse',
  z.object({
    id: z.string().openapi({ example: '6ac1ba8f1d76b9830719ee7a' }),
    board: BoardSchema,
    players: z.object({
      X: z.string().openapi({ example: 'Alice' }),
      O: z.string().openapi({ example: 'Bob' }),
    }),
    turn: PlayerSymbolSchema,
    status: GameStatusSchema,
    winner: PlayerSymbolSchema.nullable(),
  }),
);

const ValidationErrorDetailSchema = registry.register(
  'ValidationErrorDetail',
  z.object({
    path: z.string().openapi({ example: 'body.playerO' }),
    message: z.string().openapi({ example: 'playerX and playerO must be different players' }),
  }),
);

const ErrorResponseSchema = registry.register(
  'ErrorResponse',
  z.object({
    error: z.string().openapi({ example: 'Validation failed: both players must be different' }),
    details: z.array(ValidationErrorDetailSchema).optional(),
  }),
);

// 3. Routes / Paths
// /health (GET)
registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Check API and Database health status',
  responses: {
    200: {
      description: 'Healthy server status',
      content: {
        'application/json': {
          schema: z.object({
            status: z.string().openapi({ example: 'UP' }),
            database: z.string().openapi({ example: 'connected' }),
            uptime: z.number().openapi({ example: 12.34 }),
            timestamp: z.string().openapi({ format: 'date-time' }),
          }),
        },
      },
    },
    503: {
      description: 'Unhealthy server/database status',
      content: {
        'application/json': {
          schema: z.object({
            status: z.string().openapi({ example: 'DOWN' }),
            database: z.string().openapi({ example: 'disconnected' }),
            error: z.string().openapi({ example: 'connection timed out' }),
            uptime: z.number().openapi({ example: 12.34 }),
            timestamp: z.string().openapi({ format: 'date-time' }),
          }),
        },
      },
    },
  },
});

// /games (GET)
registry.registerPath({
  method: 'get',
  path: '/games',
  summary: 'List games with optional player filtering and pagination',
  security: [{ BearerAuth: [] }],
  request: {
    query: listGamesSchema.shape.query,
  },
  responses: {
    200: {
      description: 'A list of games',
      content: {
        'application/json': {
          schema: z.array(GameResponseSchema),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// /games (POST)
registry.registerPath({
  method: 'post',
  path: '/games',
  summary: 'Create a new Tic-Tac-Toe game',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: createGameSchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Game created successfully',
      content: {
        'application/json': {
          schema: GameResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request / Validation error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

// /games/{id} (GET)
registry.registerPath({
  method: 'get',
  path: '/games/{id}',
  summary: 'Retrieve a game by ID',
  security: [{ BearerAuth: [] }],
  request: {
    params: getGameSchema.shape.params,
  },
  responses: {
    200: {
      description: 'The requested game',
      content: {
        'application/json': {
          schema: GameResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Game not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// /games/{id}/moves (POST)
registry.registerPath({
  method: 'post',
  path: '/games/{id}/moves',
  summary: 'Submit a move to a game',
  security: [{ BearerAuth: [] }],
  request: {
    params: makeMoveSchema.shape.params,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: makeMoveSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Move recorded and updated game returned',
      content: {
        'application/json': {
          schema: GameResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request / Invalid Move',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Game not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// /auth/guest (POST)
registry.registerPath({
  method: 'post',
  path: '/auth/guest',
  summary: 'Create a signed guest token for player authentication',
  request: {
    body: {
      required: false,
      content: {
        'application/json': {
          schema: guestTokenSchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Guest token created successfully',
      content: {
        'application/json': {
          schema: z.object({
            token: z.string().openapi({ example: 'player:550e8400-e29b-41d4-a716-446655440000:abcdef...' }),
            name: z.string().openapi({ example: 'Alice' }),
            playerId: z.string().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
            bearer: z.string().openapi({ example: 'Bearer player:550e8400-e29b-41d4-a716-446655440000:abcdef...' }),
          }),
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// 4. Generate dynamic spec
const generator = new OpenApiGeneratorV3(registry.definitions);

export const openapiSpec = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'Tic-Tac-Toe API',
    description: 'Clean Architecture API for playing Tic-Tac-Toe games with MongoDB persistence.',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server',
    },
  ],
});
