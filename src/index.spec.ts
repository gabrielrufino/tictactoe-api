import { afterAll, describe, expect, it, vi } from 'vitest';
import { createServer } from '@/index.js';
import { disconnectFromDatabase } from '@/infrastructure/database/mongodb.js';

process.env.API_TOKEN = 'secret-token';

vi.mock('@/infrastructure/database/mongodb.js', () => {
  const mockCursor = {
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
  };

  const mockCollection = {
    updateOne: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(() => mockCursor),
  };

  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
  };

  return {
    connectToDatabase: vi.fn().mockResolvedValue(mockDb),
    disconnectFromDatabase: vi.fn(),
  };
});

describe('aPI Integration', () => {
  afterAll(async () => {
    await disconnectFromDatabase();
  });

  it('should create the server and respond to GET /games', async () => {
    const app = await createServer();
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === 'string') {
      server.close();
      throw new Error('Could not get port');
    }
    const port = address.port;

    try {
      const response = await fetch(`http://localhost:${port}/games`, {
        headers: {
          Authorization: 'Bearer secret-token',
        },
      });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual([]);
    }
    finally {
      server.close();
    }
  });
});
