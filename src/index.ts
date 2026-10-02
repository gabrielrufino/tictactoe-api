import type { Express } from 'express';
import type { GameDocument } from './adapters/repositories/mongo-game-repository.js';
import process from 'node:process';
import express from 'express';
import { pinoHttp } from 'pino-http';
import { GameController } from './adapters/controllers/game-controller.js';
import { UUIDIdGenerator } from './adapters/id/uuid-id-generator.js';
import { MongoGameRepository } from './adapters/repositories/mongo-game-repository.js';
import { connectToDatabase } from './infrastructure/database/mongodb.js';
import { logger } from './infrastructure/logger.js';
import { authenticate } from './infrastructure/middleware/auth.js';
import { CreateGameUseCase } from './usecases/create-game-use-case.js';
import { GetGameUseCase } from './usecases/get-game-use-case.js';
import { ListGamesUseCase } from './usecases/list-games-use-case.js';
import { MakeMoveUseCase } from './usecases/make-move-use-case.js';

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
  const gameRepository = new MongoGameRepository(collection);
  const idGenerator = new UUIDIdGenerator();

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
  app.use('/games', authenticate);
  app.post('/games', gameController.create);
  app.get('/games', gameController.listGames);
  app.get('/games/:id', gameController.getGame);
  app.post('/games/:id/moves', gameController.makeMove);

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
