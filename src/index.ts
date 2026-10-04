import type { Express } from 'express';
import type { Db } from 'mongodb';
import type { LowdbData } from './adapters/repositories/lowdb-game.repository.js';
import type { GameDocument } from './adapters/repositories/mongo-game.repository.js';
import type { GameRepository } from './domain/repositories/game.repository.js';
import process from 'node:process';
import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { pinoHttp } from 'pino-http';
import { GameController } from './adapters/controllers/game.controller.js';
import {
  createGameSchema,
  getGameSchema,
  listGamesSchema,
  makeMoveSchema,
} from './adapters/controllers/game.validator.js';
import { InMemoryGameEventPublisher } from './adapters/events/in-memory-game-event-publisher.adapter.js';
import { MongoIdGenerator } from './adapters/id/mongo-id-generator.adapter.js';
import { LowdbGameRepository } from './adapters/repositories/lowdb-game.repository.js';
import { MongoGameRepository } from './adapters/repositories/mongo-game.repository.js';
import { connectToDatabase } from './infrastructure/database/mongodb.js';
import { openapiSpec } from './infrastructure/docs/openapi.js';
import { logger } from './infrastructure/logger.js';
import { authenticate } from './infrastructure/middleware/auth.middleware.js';
import { errorHandler } from './infrastructure/middleware/error.middleware.js';
import { validate } from './infrastructure/middleware/validation.middleware.js';
import { CreateGameUseCase } from './use-cases/create-game.use-case.js';
import { GetGameUseCase } from './use-cases/get-game.use-case.js';
import { ListGamesUseCase } from './use-cases/list-games.use-case.js';
import { MakeMoveUseCase } from './use-cases/make-move.use-case.js';

export async function createServer(): Promise<Express> {
  if (!process.env.API_TOKEN) {
    throw new Error('API_TOKEN environment variable is required');
  }

  const app = express();
  app.use(express.json());
  app.use(pinoHttp({
    logger,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie'],
      remove: true,
    },
  }));

  // Setup Database
  const dbType = process.env.DB_TYPE || 'mongodb';
  let gameRepository: GameRepository;
  let db: Db | null = null;

  if (dbType === 'file' || dbType === 'lowdb') {
    const dbPath = process.env.DB_FILE_PATH || 'db.json';
    const adapter = new JSONFile<LowdbData>(dbPath);
    const lowdbInstance = new Low<LowdbData>(adapter, { games: [] });
    await lowdbInstance.read();
    gameRepository = new LowdbGameRepository(lowdbInstance);
  }
  else {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.DB_NAME || 'tictactoe';
    const mongoDb = await connectToDatabase(mongoUri, dbName);
    db = mongoDb;

    // Setup Repositories and Ports
    const collection = mongoDb.collection<GameDocument>('games');

    // Configure Indexes (safely for testing mocks)
    if (collection && typeof collection.createIndex === 'function') {
      await collection.createIndex({ 'players.X': 1 });
      await collection.createIndex({ 'players.O': 1 });
      const ttlSeconds = Number(process.env.DB_GAME_TTL) || 2592000; // default 30 days
      await collection.createIndex({ updatedAt: 1 }, { expireAfterSeconds: ttlSeconds });
    }

    gameRepository = new MongoGameRepository(collection);
  }

  const idGenerator = new MongoIdGenerator();
  const gameEventPublisher = new InMemoryGameEventPublisher();

  // Setup Use Cases
  const createGameUseCase = new CreateGameUseCase(gameRepository, idGenerator);
  const getGameUseCase = new GetGameUseCase(gameRepository);
  const makeMoveUseCase = new MakeMoveUseCase(gameRepository, gameEventPublisher);
  const listGamesUseCase = new ListGamesUseCase(gameRepository);

  // Setup Controller
  const gameController = new GameController(
    createGameUseCase,
    makeMoveUseCase,
    getGameUseCase,
    listGamesUseCase,
    gameEventPublisher,
  );

  // Routes
  app.get('/health', async (req, res) => {
    try {
      if (db) {
        await db.command({ ping: 1 });
      }
      res.status(200).json({
        status: 'UP',
        database: dbType === 'mongodb' ? 'connected' : 'file-based',
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

  app.use('/games', authenticate);
  app.post('/games', validate(createGameSchema), gameController.create);
  app.get('/games', validate(listGamesSchema), gameController.listGames);
  app.get('/games/:id', validate(getGameSchema), gameController.getGame);
  app.get('/games/:id/events', validate(getGameSchema), gameController.getEvents);
  app.post('/games/:id/moves', validate(makeMoveSchema), gameController.makeMove);

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
