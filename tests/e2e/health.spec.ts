import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createServer } from '../../src/index.js';
import { disconnectFromDatabase } from '../../src/infrastructure/database/mongodb.js';

vi.mock('../../src/infrastructure/database/mongodb.js', () => {
  const mockDb = {
    collection: vi.fn(),
    command: vi.fn().mockResolvedValue({ ok: 1 }),
  };

  return {
    connectToDatabase: vi.fn().mockResolvedValue(mockDb),
    disconnectFromDatabase: vi.fn(),
  };
});

describe('e2E: Health API', () => {
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
});
