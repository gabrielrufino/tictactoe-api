# Agent Instructions

## Critical TS/ESM Import Rule
- This project uses `"module": "NodeNext"`. **All local imports must use the `.js` extension** (e.g., `import { createServer } from './index.js'`) even though the source files are `.ts`.
- Omitting the `.js` extension or using `.ts` in imports will fail the TypeScript build and ESLint checks.

## Dependencies Rule
- All installed packages must have their versions strictly fixed in `package.json` (no `^` or `~` prefixes).

## Code Style & Conventions
- **Code filenames must follow the file-type pattern** (e.g., `*.file-type.ts`, such as `*.use-case.ts`, `*.controller.ts`).

## Architecture
- Strictly adheres to **Clean Architecture**:
  - **Entities** (`src/domain/entities/`): Pure business logic.
  - **Use Cases** (`src/use-cases/`): Orchestration & application business rules (Create Game, Make Move, Join Queue, Leave Queue, Create Guest Token, List Games, Get Game).
  - **Adapters** (`src/adapters/`): Database models (`MongoGameRepository`), HTTP controllers (`GameController`, `AuthController`, `MatchmakingController`), validators, event publishers, DTOs/mappers, and ID generators.
  - **Infrastructure** (`src/infrastructure/`): Express, MongoDB connection setup, middleware (auth, CORS, error handling, validation), logging, matchmaking queue, and OpenAPI docs.

## Authentication & DB Prerequisites
- Most endpoints require Bearer Authentication via the `Authorization` header.
  - **Default token:** `secret-token` (controlled by `API_TOKEN` env var). Include header `Authorization: Bearer secret-token`.
  - Public endpoints: `/health`, `/docs`, `/openapi.json`, `/auth/guest`, `/matchmaking/status`.
  - Authenticated endpoints: `/games/*`, `/matchmaking/join`, `/matchmaking/leave`, `/matchmaking/events`.
- **Database:** MongoDB is used. Running database required only for app execution, NOT for tests.
  - Default `MONGODB_URI`: `mongodb://localhost:27017`
  - Default `DB_NAME`: `tictactoe`

## Testing Quirks
- **No active database is required to run tests.** All E2E tests (`tests/e2e/games.spec.ts`, `tests/e2e/auth.spec.ts`, `tests/e2e/health.spec.ts`) mock MongoDB operations using Vitest top-level mocks.
- Run single test file: `npx vitest run src/domain/entities/game.entity.spec.ts`
- Mutation testing: `npm run test:mutation` (uses Stryker)

## Developer Commands
- Run Dev Server: `npm run start:dev` (uses `tsx watch`, no build required)
- Build Project: `npm run build` (required before `npm start`)
- Run Production: `npm start`
- Run Linting: `npm run lint` / Auto-fix: `npm run lint:fix`
- Run Tests: `npm test`
- Run Tests with Coverage: `npm run test:cov`
- Run Tests in Watch Mode: `npm run test:watch`
- Run Mutation Tests: `npm run test:mutation` (uses Stryker)
- Run Demo: `npm run demo`
