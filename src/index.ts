import type { Express } from 'express';
import type { GameDocument } from '@/adapters/repositories/mongo-game.repository.js';
import type { GameRepository } from '@/domain/repositories/game.repository.js';
import process from 'node:process';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { AuthController } from '@/adapters/controllers/auth.controller.js';
import { guestTokenSchema } from '@/adapters/controllers/auth.validator.js';
import { GameController } from '@/adapters/controllers/game.controller.js';
import {
  createGameSchema,
  getGameSchema,
  listGamesSchema,
  makeMoveSchema,
} from '@/adapters/controllers/game.validator.js';
import { MatchmakingController } from '@/adapters/controllers/matchmaking.controller.js';
import { getMatchmakingStatusSchema, joinQueueSchema, leaveQueueSchema } from '@/adapters/controllers/matchmaking.validator.js';
import { InMemoryGameEventPublisher } from '@/adapters/events/in-memory-game-event-publisher.adapter.js';
import { InMemoryMatchmakingEventPublisher } from '@/adapters/events/in-memory-matchmaking-event-publisher.adapter.js';
import { MongoIdGenerator } from '@/adapters/id/mongo-id-generator.adapter.js';
import { MongoGameRepository } from '@/adapters/repositories/mongo-game.repository.js';
import { connectToDatabase } from '@/infrastructure/database/mongodb.js';
import { openapiSpec } from '@/infrastructure/docs/openapi.js';
import { logger } from '@/infrastructure/logger.js';
import { MatchmakingQueueImpl } from '@/infrastructure/matchmaking-queue.js';
import { authenticate } from '@/infrastructure/middleware/auth.middleware.js';
import { errorHandler } from '@/infrastructure/middleware/error.middleware.js';
import { validate } from '@/infrastructure/middleware/validation.middleware.js';
import { CreateGameUseCase } from '@/use-cases/create-game.use-case.js';
import { CreateGuestTokenUseCase } from '@/use-cases/create-guest-token.use-case.js';
import { GetGameUseCase } from '@/use-cases/get-game.use-case.js';
import { JoinQueueUseCase } from '@/use-cases/join-queue.use-case.js';
import { LeaveQueueUseCase } from '@/use-cases/leave-queue.use-case.js';
import { ListGamesUseCase } from '@/use-cases/list-games.use-case.js';
import { MakeMoveUseCase } from '@/use-cases/make-move.use-case.js';

export async function createServer(): Promise<Express> {
  if (!process.env.API_TOKEN) {
    throw new Error('API_TOKEN environment variable is required');
  }

  const app = express();
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ['\'self\'', 'https://unpkg.com'],
      },
    },
  }));
  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });
  app.use(pinoHttp({
    logger,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie'],
      remove: true,
    },
  }));

  // Setup Database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'tictactoe';
  const db = await connectToDatabase(mongoUri, dbName);

  // Setup Repositories and Ports
  const collection = db.collection<GameDocument>('games');

  // Configure Indexes (safely for testing mocks)
  if (collection && typeof collection.createIndex === 'function') {
    await collection.createIndex({ 'players.X': 1 });
    await collection.createIndex({ 'players.O': 1 });
    const ttlSeconds = Number(process.env.DB_GAME_TTL) || 2592000; // default 30 days
    await collection.createIndex({ updatedAt: 1 }, { expireAfterSeconds: ttlSeconds });
  }

  const gameRepository: GameRepository = new MongoGameRepository(collection);

  const idGenerator = new MongoIdGenerator();
  const gameEventPublisher = new InMemoryGameEventPublisher();

  // Setup Use Cases
  const createGameUseCase = new CreateGameUseCase(gameRepository, idGenerator);
  const getGameUseCase = new GetGameUseCase(gameRepository);
  const makeMoveUseCase = new MakeMoveUseCase(gameRepository, gameEventPublisher);
  const listGamesUseCase = new ListGamesUseCase(gameRepository);
  const createGuestTokenUseCase = new CreateGuestTokenUseCase();
  const matchmakingQueue = new MatchmakingQueueImpl();
  const matchmakingEventPublisher = new InMemoryMatchmakingEventPublisher();
  const joinQueueUseCase = new JoinQueueUseCase(gameRepository, idGenerator, matchmakingQueue, matchmakingEventPublisher);
  const leaveQueueUseCase = new LeaveQueueUseCase(matchmakingQueue, matchmakingEventPublisher);

  // Setup Controller
  const gameController = new GameController(
    createGameUseCase,
    makeMoveUseCase,
    getGameUseCase,
    listGamesUseCase,
    gameEventPublisher,
  );
  const authController = new AuthController(createGuestTokenUseCase);
  const matchmakingController = new MatchmakingController(
    joinQueueUseCase,
    leaveQueueUseCase,
    matchmakingQueue,
    matchmakingEventPublisher,
  );

  // Routes
  app.get('/health', async (req, res) => {
    try {
      if (db) {
        await db.command({ ping: 1 });
      }
      res.status(200).json({
        status: 'UP',
        database: 'connected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }
    catch (error: any) {
      logger.error({ error }, 'Database health check failed');
      res.status(503).json({
        status: 'DOWN',
        database: 'disconnected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get('/openapi.json', (req, res) => {
    res.status(200).json(openapiSpec);
  });

  app.get('/docs', (req, res) => {
    res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tic Tac Toe API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>
    `);
  });

  app.post('/matchmaking/join', validate(joinQueueSchema), (req, res, next) => matchmakingController.join(req, res, next));
  app.delete('/matchmaking/leave', validate(leaveQueueSchema), (req, res, next) => matchmakingController.leave(req, res, next));
  app.get('/matchmaking/status', validate(getMatchmakingStatusSchema), (req, res, next) => matchmakingController.getStatus(req, res, next));
  app.get('/matchmaking/events', (req, res, next) => matchmakingController.getEvents(req, res, next));

  app.post('/auth/guest', validate(guestTokenSchema), (req, res, next) => authController.createGuestToken(req, res, next));

  app.use('/games', authenticate);
  app.post('/games', validate(createGameSchema), (req, res, next) => gameController.create(req, res, next));
  app.get('/games', validate(listGamesSchema), (req, res, next) => gameController.listGames(req, res, next));
  app.get('/games/:id', validate(getGameSchema), (req, res, next) => gameController.getGame(req, res, next));
  app.get('/games/:id/events', validate(getGameSchema), (req, res, next) => gameController.getEvents(req, res, next));
  app.post('/games/:id/moves', validate(makeMoveSchema), (req, res, next) => gameController.makeMove(req, res, next));

  app.use(errorHandler);

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3000;
  createServer()
    .then((app) => {
      app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
      });
    })
    .catch((error) => {
      logger.error({ error }, 'Failed to start server');
      process.exit(1);
    });
}
