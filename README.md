# TicTacToe API

Robust, production-ready Tic-Tac-Toe REST API built with TypeScript, Express, and MongoDB, following **Clean Architecture** principles.

## Features

- **Game Management**: Create games, list games, retrieve game details, and make moves.
- **Real-Time Events**: Server-Sent Events (SSE) endpoint (`/games/:id/events`) for real-time game state updates.
- **Clean Architecture**: Strict separation of concerns (Domain entities, Use Cases, Adapters, Infrastructure).
- **Validation & OpenAPI**: Request validation using Zod and interactive Swagger UI documentation (`/docs`).
- **Security & Logging**: Bearer token authentication, HTTP request logging with Pino, and secure headers.
- **Comprehensive Testing**: Unit tests, integration/E2E tests with Vitest, and mutation testing with Stryker.

## Architecture

- **Domain (`src/domain/`)**: Pure business logic, game rules, entities, and repository interfaces.
- **Use Cases (`src/use-cases/`)**: Application orchestration and business rules (Create Game, Make Move, etc.).
- **Adapters (`src/adapters/`)**: Database models (`MongoGameRepository`), HTTP controllers (`GameController`), validators, and event publishers.
- **Infrastructure (`src/infrastructure/`)**: Express server setup, MongoDB connection, middleware (auth, error handling, validation), and logging.

## Prerequisites

- Node.js (v20.19.0+ or later)
- MongoDB (running locally or remote URI)

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```env
API_TOKEN=secret-token
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
MONGODB_URI=mongodb://localhost:27017
DB_NAME=tictactoe
DB_GAME_TTL=2592000
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run start:dev
   ```

3. Build and run production:
   ```bash
   npm run build
   npm start
   ```

## API Documentation

Once the server is running, access Swagger UI documentation at:
`http://localhost:3000/docs`

OpenAPI JSON schema is available at:
`http://localhost:3000/openapi.json`

## Authentication

All endpoints under `/games` require Bearer Authentication:
`Authorization: Bearer <API_TOKEN>` (default: `secret-token`).

## Testing

- Run tests:
  ```bash
  npm test
  ```
- Run tests with coverage:
  ```bash
  npm run test:cov
  ```
- Run mutation tests:
  ```bash
  npm run test:mutation
  ```

## Linting

- Run linter:
  ```bash
  npm run lint
  ```
- Fix lint errors:
  ```bash
  npm run lint:fix
  ```

## License

UNLICENSED
