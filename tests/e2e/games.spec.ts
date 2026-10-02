import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createServer } from '../../src/index.js';
import { disconnectFromDatabase } from '../../src/infrastructure/database/mongodb.js';

// Mock DB connection and collection at the top-level
vi.mock('../../src/infrastructure/database/mongodb.js', () => {
  const mockGames: any[] = [];
  const mockCollection = {
    updateOne: vi.fn().mockImplementation(async (query, update, _options) => {
      const id = query._id;
      const existingIndex = mockGames.findIndex(g => g._id === id);
      const setObj = update.$set;
      if (existingIndex !== -1) {
        mockGames[existingIndex] = { ...mockGames[existingIndex], ...setObj };
      }
      else {
        mockGames.push({ _id: id, ...setObj });
      }
      return { upsertedId: id };
    }),
    findOne: vi.fn().mockImplementation(async (query) => {
      const id = query._id;
      const game = mockGames.find(g => g._id === id);
      return game || null;
    }),
    find: vi.fn().mockImplementation((query) => {
      let filtered = mockGames;
      if (query && query.$or) {
        const xFilter = query.$or[0]['players.X'];
        const oFilter = query.$or[1]['players.O'];
        filtered = mockGames.filter(g => g.players.X === xFilter || g.players.O === oFilter);
      }

      const cursor = {
        skip: vi.fn().mockImplementation((skipNum) => {
          filtered = filtered.slice(skipNum);
          return cursor;
        }),
        limit: vi.fn().mockImplementation((limitNum) => {
          filtered = filtered.slice(0, limitNum);
          return cursor;
        }),
        toArray: vi.fn().mockImplementation(async () => filtered),
      };

      return cursor;
    }),
  };

  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
  };

  return {
    connectToDatabase: vi.fn().mockResolvedValue(mockDb),
    disconnectFromDatabase: vi.fn(),
  };
});

describe('e2E: Games API', () => {
  afterAll(async () => {
    await disconnectFromDatabase();
  });

  describe('authentication', () => {
    it('should return 401 Unauthorized if Authorization header is missing', async () => {
      const app = await createServer();
      const response = await request(app)
        .get('/games')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized: Missing or invalid token format',
      });
    });

    it('should return 401 Unauthorized if Authorization token is invalid', async () => {
      const app = await createServer();
      const response = await request(app)
        .get('/games')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized: Invalid token',
      });
    });
  });

  describe('games CRUD Operations', () => {
    it('should perform full game workflow: create, list, retrieve, and make moves', async () => {
      const app = await createServer();
      const token = 'Bearer secret-token';

      // 1. List games should return empty initially
      const listResponse1 = await request(app)
        .get('/games')
        .set('Authorization', token)
        .expect(200);

      expect(listResponse1.body).toEqual([]);

      // 2. Create game
      const createResponse = await request(app)
        .post('/games')
        .set('Authorization', token)
        .send({ playerX: 'Alice', playerO: 'Bob' })
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.players).toEqual({ X: 'Alice', O: 'Bob' });
      expect(createResponse.body.status).toBe('PLAYING');
      expect(createResponse.body.turn).toBe('X');
      expect(createResponse.body.board).toEqual([
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);

      const gameId = createResponse.body.id;

      // 3. List games should now return the created game
      const listResponse2 = await request(app)
        .get('/games')
        .set('Authorization', token)
        .expect(200);

      expect(listResponse2.body).toHaveLength(1);
      expect(listResponse2.body[0].id).toBe(gameId);

      // 4. Retrieve the game by ID
      const getResponse = await request(app)
        .get(`/games/${gameId}`)
        .set('Authorization', token)
        .expect(200);

      expect(getResponse.body.id).toBe(gameId);

      // 5. Make a move (playerX placing X at 0, 0)
      const moveResponse = await request(app)
        .post(`/games/${gameId}/moves`)
        .set('Authorization', token)
        .send({ playerSymbol: 'X', row: 0, col: 0 })
        .expect(200);

      expect(moveResponse.body.board[0][0]).toBe('X');
      expect(moveResponse.body.turn).toBe('O'); // Switch turn to playerO
    });

    it('should return 400 Bad Request if playerX or playerO is missing during creation', async () => {
      const app = await createServer();
      const token = 'Bearer secret-token';

      const response = await request(app)
        .post('/games')
        .set('Authorization', token)
        .send({ playerX: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 Not Found if trying to retrieve a non-existent game', async () => {
      const app = await createServer();
      const token = 'Bearer secret-token';

      const response = await request(app)
        .get('/games/non-existent-id')
        .set('Authorization', token)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 Bad Request if making a move on a non-existent game', async () => {
      const app = await createServer();
      const token = 'Bearer secret-token';

      const response = await request(app)
        .post('/games/non-existent-id/moves')
        .set('Authorization', token)
        .send({ playerSymbol: 'X', row: 0, col: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 Bad Request if making an invalid move', async () => {
      const app = await createServer();
      const token = 'Bearer secret-token';

      // Create a valid game first
      const createResponse = await request(app)
        .post('/games')
        .set('Authorization', token)
        .send({ playerX: 'Alice', playerO: 'Bob' })
        .expect(201);

      const gameId = createResponse.body.id;

      // Try making a move with wrong player's turn (O instead of X)
      const response = await request(app)
        .post(`/games/${gameId}/moves`)
        .set('Authorization', token)
        .send({ playerSymbol: 'O', row: 0, col: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should filter games by player query parameter', async () => {
      const app = await createServer();
      const token = 'Bearer secret-token';

      // Create a game with Alice and Bob
      await request(app)
        .post('/games')
        .set('Authorization', token)
        .send({ playerX: 'Alice', playerO: 'Bob' })
        .expect(201);

      // Create a game with Charlie and David
      await request(app)
        .post('/games')
        .set('Authorization', token)
        .send({ playerX: 'Charlie', playerO: 'David' })
        .expect(201);

      // List games filtering by Alice
      const responseAlice = await request(app)
        .get('/games?player=Alice')
        .set('Authorization', token)
        .expect(200);

      expect(responseAlice.body.length).toBeGreaterThanOrEqual(1);
      expect(responseAlice.body.every((g: any) => g.players.X === 'Alice' || g.players.O === 'Alice')).toBe(true);

      // List games filtering by NonExistent
      const responseNone = await request(app)
        .get('/games?player=NonExistent')
        .set('Authorization', token)
        .expect(200);

      expect(responseNone.body).toEqual([]);
    });

    it('should filter and paginate games list in E2E', async () => {
      const app = await createServer();
      const token = 'Bearer secret-token';

      // Create games with pagination-specific players
      await request(app)
        .post('/games')
        .set('Authorization', token)
        .send({ playerX: 'P1', playerO: 'P2' })
        .expect(201);

      await request(app)
        .post('/games')
        .set('Authorization', token)
        .send({ playerX: 'P1', playerO: 'P3' })
        .expect(201);

      await request(app)
        .post('/games')
        .set('Authorization', token)
        .send({ playerX: 'P1', playerO: 'P4' })
        .expect(201);

      // Get page 1 with limit 2 for player P1
      const resPage1 = await request(app)
        .get('/games?player=P1&page=1&limit=2')
        .set('Authorization', token)
        .expect(200);

      expect(resPage1.body.length).toBe(2);
      expect(resPage1.body[0].players.X).toBe('P1');
      expect(resPage1.body[1].players.X).toBe('P1');

      // Get page 2 with limit 2 for player P1
      const resPage2 = await request(app)
        .get('/games?player=P1&page=2&limit=2')
        .set('Authorization', token)
        .expect(200);

      expect(resPage2.body.length).toBe(1);
    });
  });
});
