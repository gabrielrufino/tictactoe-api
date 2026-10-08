import crypto from 'node:crypto';
import process from 'node:process';

export interface CreateGuestTokenInput {
  name?: string
}

export interface CreateGuestTokenResult {
  token: string
  name: string
}

export class CreateGuestTokenUseCase {
  public execute(input: CreateGuestTokenInput = {}): CreateGuestTokenResult {
    const expectedToken = process.env.API_TOKEN;

    if (!expectedToken) {
      throw new Error('API_TOKEN is not configured');
    }

    const name = input.name && input.name.trim().length > 0
      ? input.name.trim()
      : `Guest_${crypto.randomUUID()}`;

    const signature = crypto
      .createHmac('sha256', expectedToken)
      .update(name)
      .digest('hex');

    const token = `player:${name}:${signature}`;

    return {
      token,
      name,
    };
  }
}
