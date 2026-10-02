# Agent Instructions

## Critical TS/ESM Import Rule
- This project uses `"module": "NodeNext"`. **All local imports must use the `.js` extension** (e.g., `import { createServer } from './index.js'`) even though the source files are `.ts`.
- Omitting the `.js` extension or using `.ts` in imports will fail the TypeScript build and ESLint checks.

## Code Style & Conventions
- **Code filenames must be in kebab-case** (e.g., `my-file-name.ts`).

## Architecture
- Strictly adheres to **Clean Architecture**:
  - **Entities** (`src/domain/entities/`): Pure business logic.
  - **Use Cases** (`src/usecases/`): Orchestration & application business rules.
  - **Adapters** (`src/adapters/`): Converts database models (`MongoGameRepository`) and handles requests (`GameController`).
  - **Infrastructure** (`src/infrastructure/`): Express, MongoDB connection setup, middleware, and logging.

## Authentication & DB Prerequisites
- All endpoints under `/games` require Bearer Authentication.
  - **Default token:** `secret-token` (controlled by `API_TOKEN` env var). Include header `Authorization: Bearer secret-token`.
- **Database:** MongoDB is used. Running database required only for app execution, NOT for tests.
  - Default `MONGODB_URI`: `mongodb://localhost:27017`
  - Default `DB_NAME`: `tictactoe`

## Testing Quirks
- **No active database is required to run tests.** Both unit and E2E tests (`tests/e2e/games.spec.ts`) mock MongoDB operations using Vitest top-level mocks.
- Run single test file: `npx vitest run src/domain/entities/Game.spec.ts`
- Mutation testing: `npm run test:mutation` (uses Stryker)

## Developer Commands
- Run Dev Server: `npm run dev` (uses `tsx watch`, no build required)
- Build Project: `npm run build` (required before `npm start`)
- Run Production: `npm start`
- Run Linting: `npm run lint` / Auto-fix: `npm run lint:fix`
- Run Tests: `npm test`
