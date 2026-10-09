import { z } from 'zod';

import { guestTokenBody } from '@/shared/schemas/auth.schemas.js';

export { guestTokenBody } from '@/shared/schemas/auth.schemas.js';
export type { GuestTokenBody } from '@/shared/schemas/auth.schemas.js';

// Wrapper schema for validation middleware and OpenAPI compatibility
export const guestTokenSchema = z.object({
  body: guestTokenBody.optional(),
});
