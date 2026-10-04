import type { Express } from 'express';
import type { GameDocument } from './adapters/repositories/mongo-game.repository.js';
import process from 'node:process';
import express from 'express';
import { pinoHttp } from 'pino-http';
import { GameController } from './adapters/controllers/game.controller.js';
import {
  createGameSchema,
  getGameSchema,
  listGamesSchema,
  makeMoveSchema,
} from './adapters/controllers/game.validator.js';
import { MongoIdGenerator } from './adapters/id/mongo-id-generator.adapter.js';
import { MongoGameRepository } from './adapters/repositories/mongo-game.repository.js';
import { connectToDatabase } from './infrastructure/database/mongodb.js';
import { openapiSpec } from './infrastructure/docs/openapi.js';
import { logger } from './infrastructure/logger.js';
import { authenticate } from './infrastructure/middleware/auth.middleware.js';
import { errorHandler } from './infrastructure/middleware/error.middleware.js';
import { validate } from './infrastructure/middleware/validation.middleware.js';
import { CreateGameUseCase } from './usecases/create-game.use-case.js';
import { GetGameUseCase } from './usecases/get-game.use-case.js';
import { ListGamesUseCase } from './usecases/list-games.use-case.js';
import { MakeMoveUseCase } from './usecases/make-move.use-case.js';

export async function createServer(): Promise<Express> {
  const app = express();
  app.use(express.json());
  app.use(pinoHttp({ logger }));

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

  const gameRepository = new MongoGameRepository(collection);
  const idGenerator = new MongoIdGenerator();

  // Setup Use Cases
  const createGameUseCase = new CreateGameUseCase(gameRepository, idGenerator);
  const getGameUseCase = new GetGameUseCase(gameRepository);
  const makeMoveUseCase = new MakeMoveUseCase(gameRepository);
  const listGamesUseCase = new ListGamesUseCase(gameRepository);

  // Setup Controller
  const gameController = new GameController(
    createGameUseCase,
    makeMoveUseCase,
    getGameUseCase,
    listGamesUseCase,
  );

  // Routes
  app.get('/health', async (req, res) => {
    try {
      await db.command({ ping: 1 });
      res.status(200).json({
        status: 'UP',
        database: 'connected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }
    catch (error: any) {
      res.status(503).json({
        status: 'DOWN',
        database: 'disconnected',
        error: error.message || 'Unknown error',
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
  app.post('/games/:id/moves', validate(makeMoveSchema), gameController.makeMove);

  app.use(errorHandler);

  return app;
}

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
