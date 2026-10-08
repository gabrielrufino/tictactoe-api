import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createServer } from '@/index.js';
import { disconnectFromDatabase } from '@/infrastructure/database/mongodb.js';

process.env.API_TOKEN = 'secret-token';

vi.mock('@/infrastructure/database/mongodb.js', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({
    collection: vi.fn().mockReturnValue({
      createIndex: vi.fn(),
    }),
  }),
  disconnectFromDatabase: vi.fn(),
}));

describe('e2E: Auth & Guest Token API', () => {
  afterAll(async () => {
    await disconnectFromDatabase();
  });

  it('should create a guest token with a specified name', async () => {
    const app = await createServer();
    const response = await request(app)
      .post('/auth/guest')
      .send({ name: 'Alice' })
      .expect(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body.name).toBe('Alice');
    expect(response.body.token).toMatch(/^player:Alice:[0-9a-f]{64}$/);
    expect(response.body.bearer).toBe(`Bearer ${response.body.token}`);
  });

  it('should create a guest token with a random name if none provided', async () => {
    const app = await createServer();
    const response = await request(app)
      .post('/auth/guest')
      .send({})
      .expect(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body.name).toMatch(/^Guest_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(response.body.token).toMatch(new RegExp(`^player:${response.body.name}:[0-9a-f]{64}$`));
  });
});
