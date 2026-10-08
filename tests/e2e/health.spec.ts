import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createServer } from '@/index.js';
import { disconnectFromDatabase } from '@/infrastructure/database/mongodb.js';

process.env.API_TOKEN = 'secret-token';

vi.mock('@/infrastructure/database/mongodb.js', () => {
  const mockCollection = {
    createIndex: vi.fn(),
    updateOne: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
  };

  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
    command: vi.fn().mockResolvedValue({ ok: 1 }),
  };

  return {
    connectToDatabase: vi.fn().mockResolvedValue(mockDb),
    disconnectFromDatabase: vi.fn(),
  };
});

describe('health API (e2e)', () => {
  afterAll(async () => {
    await disconnectFromDatabase();
  });

  it('should return 200 UP when server is healthy', async () => {
    const app = await createServer();
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('database', 'connected');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return 200 and the OpenAPI specification', async () => {
    const app = await createServer();
    const response = await request(app)
      .get('/openapi.json')
      .expect(200);

    expect(response.body).toHaveProperty('openapi', '3.0.3');
    expect(response.body).toHaveProperty('info');
    expect(response.body.info).toHaveProperty('title', 'Tic-Tac-Toe API');
  });

  it('should return 200 and Swagger UI HTML on /docs', async () => {
    const app = await createServer();
    const response = await request(app)
      .get('/docs')
      .expect(200);

    expect(response.text).toContain('SwaggerUIBundle');
    expect(response.text).toContain('/openapi.json');
  });
});
