# TicTacToe API

Robust, production-ready Tic-Tac-Toe REST API built with TypeScript, Express, and MongoDB, following **Clean Architecture** principles.

## Features

- **Game Management**: Create games, list games, retrieve game details, and make moves.
- **Real-Time Events**: Server-Sent Events (SSE) endpoints (`/games/:id/events` and `/matchmaking/events`) for real-time game state and matchmaking updates.
- **Matchmaking**: Join/leave queues, get match status, and receive real-time matchmaking events via SSE.
- **Guest Authentication**: Create guest player tokens via `/auth/guest` for anonymous play.
- **Health Check**: `/health` endpoint for liveness and readiness probes.
- **Clean Architecture**: Strict separation of concerns (Domain entities, Use Cases, Adapters, Infrastructure).
- **Validation & OpenAPI**: Request validation using Zod and interactive Swagger UI documentation (`/docs`).
- **Security & Logging**: Bearer token authentication, CORS support, HTTP request logging with Pino, and secure headers.
- **Comprehensive Testing**: Unit tests, integration/E2E tests with Vitest, and mutation testing with Stryker.

## Architecture

- **Domain (`src/domain/`)**: Pure business logic, game rules, entities, and repository interfaces.
- **Use Cases (`src/use-cases/`)**: Application orchestration and business rules (Create Game, Make Move, Join Queue, Leave Queue, Create Guest Token, etc.).
- **Adapters (`src/adapters/`)**: Database models (`MongoGameRepository`), HTTP controllers (`GameController`, `AuthController`, `MatchmakingController`), validators, event publishers, DTOs/mappers, and ID generators.
- **Infrastructure (`src/infrastructure/`)**: Express server setup, MongoDB connection, middleware (auth, CORS, error handling, validation), logging, matchmaking queue, and OpenAPI docs.

## Prerequisites

- Node.js (v20.19.0+ or later)
- MongoDB (running locally or remote URI)

## Running with Docker

A `docker-compose.yml` is provided to spin up a local MongoDB instance:

```bash
docker-compose up -d
```

## Demo

A demo frontend is available in the `demo/` directory:

```bash
npm run demo
```

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

Most endpoints require Bearer Authentication via the `Authorization` header:
`Authorization: Bearer <API_TOKEN>` (default: `secret-token`).

| Endpoint | Auth Required |
|---|---|
| `/health` | No |
| `/docs` | No |
| `/openapi.json` | No |
| `/auth/guest` | No |
| `/matchmaking/status` | No |
| `/games/*` | Yes |
| `/matchmaking/join` | Yes |
| `/matchmaking/leave` | Yes |
| `/matchmaking/events` | Yes |

## API Endpoints

### Health Check

```
GET /health
```

Returns server and database connectivity status.

### Authentication

```
POST /auth/guest
```

Creates a guest player token for anonymous play.

### Matchmaking

- `POST /matchmaking/join` — Join the matchmaking queue
- `DELETE /matchmaking/leave` — Leave the matchmaking queue
- `GET /matchmaking/status` — Get current matchmaking status
- `GET /matchmaking/events` — SSE endpoint for real-time matchmaking events

### Games

- `POST /games` — Create a new game
- `GET /games` — List all games
- `GET /games/:id` — Get game details
- `GET /games/:id/events` — SSE endpoint for real-time game state updates
- `POST /games/:id/moves` — Make a move

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
