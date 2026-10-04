export const openapiSpec = {
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
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Bearer token validation. Use `secret-token` or `player:<playerName>`.',
      },
    },
    schemas: {
      GameStatus: {
        type: 'string',
        enum: ['PLAYING', 'WON', 'DRAW'],
      },
      PlayerSymbol: {
        type: 'string',
        enum: ['X', 'O'],
      },
      BoardCell: {
        type: 'string',
        enum: ['X', 'O'],
        nullable: true,
      },
      Board: {
        type: 'array',
        items: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/BoardCell',
          },
          minItems: 3,
          maxItems: 3,
        },
        minItems: 3,
        maxItems: 3,
      },
      GameResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '6ac1ba8f1d76b9830719ee7a',
          },
          board: {
            $ref: '#/components/schemas/Board',
          },
          players: {
            type: 'object',
            properties: {
              X: { type: 'string', example: 'Alice' },
              O: { type: 'string', example: 'Bob' },
            },
          },
          turn: {
            $ref: '#/components/schemas/PlayerSymbol',
          },
          status: {
            $ref: '#/components/schemas/GameStatus',
          },
          winner: {
            $ref: '#/components/schemas/PlayerSymbol',
            nullable: true,
          },
        },
      },
      ValidationErrorDetail: {
        type: 'object',
        properties: {
          path: { type: 'string', example: 'body.playerO' },
          message: { type: 'string', example: 'playerX and playerO must be different players' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Validation failed: both players must be different' },
          details: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ValidationErrorDetail',
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Check API and Database health status',
        responses: {
          200: {
            description: 'Healthy server status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'UP' },
                    database: { type: 'string', example: 'connected' },
                    uptime: { type: 'number', example: 12.34 },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          503: {
            description: 'Unhealthy server/database status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'DOWN' },
                    database: { type: 'string', example: 'disconnected' },
                    error: { type: 'string', example: 'connection timed out' },
                    uptime: { type: 'number', example: 12.34 },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/games': {
      get: {
        summary: 'List games with optional player filtering and pagination',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'player',
            in: 'query',
            description: 'Filter games where this player is participating (either X or O)',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination',
            required: false,
            schema: { type: 'integer', default: 1, minimum: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of games per page',
            required: false,
            schema: { type: 'integer', default: 10, minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: 'A list of games',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/GameResponse',
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new Tic-Tac-Toe game',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['playerX', 'playerO'],
                properties: {
                  playerX: { type: 'string', example: 'Alice' },
                  playerO: { type: 'string', example: 'Bob' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Game created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GameResponse',
                },
              },
            },
          },
          400: {
            description: 'Bad Request / Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/games/{id}': {
      get: {
        summary: 'Retrieve a game by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'The game ID',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'The requested game',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GameResponse',
                },
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
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/games/{id}/moves': {
      post: {
        summary: 'Submit a move to a game',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'The game ID',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['playerSymbol', 'row', 'col'],
                properties: {
                  playerSymbol: {
                    $ref: '#/components/schemas/PlayerSymbol',
                  },
                  row: { type: 'integer', minimum: 0, maximum: 2, example: 1 },
                  col: { type: 'integer', minimum: 0, maximum: 2, example: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Move recorded and updated game returned',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GameResponse',
                },
              },
            },
          },
          400: {
            description: 'Bad Request / Invalid Move',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
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
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
};
