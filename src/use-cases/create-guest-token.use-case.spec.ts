import { describe, expect, it } from 'vitest';
import { CreateGuestTokenUseCase } from '@/use-cases/create-guest-token.use-case.js';

process.env.API_TOKEN = 'secret-token';

describe('createGuestTokenUseCase', () => {
  it('should generate a valid signed player token for a given name', () => {
    const useCase = new CreateGuestTokenUseCase();
    const result = useCase.execute({ name: 'Alice' });

    expect(result.name).toBe('Alice');
    expect(result.playerId).toBeDefined();
    expect(result.playerId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(result.token).toMatch(/^player:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{64}$/);
  });

  it('should generate a random guest name and token if name is not provided', () => {
    const useCase = new CreateGuestTokenUseCase();
    const result = useCase.execute({});

    expect(result.name).toMatch(/^Guest_[0-9a-f]{5}$/);
    expect(result.playerId).toBeDefined();
    expect(result.playerId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(result.token).toMatch(new RegExp(`^player:${result.playerId}:[0-9a-f]{64}$`));
  });

  it('should throw an error if API_TOKEN is not configured', () => {
    const originalToken = process.env.API_TOKEN;
    delete process.env.API_TOKEN;

    const useCase = new CreateGuestTokenUseCase();
    expect(() => useCase.execute({ name: 'Alice' })).toThrow('API_TOKEN is not configured');

    process.env.API_TOKEN = originalToken;
  });
});
