import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const guestTokenSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'name cannot be empty').refine(val => !val.includes(':'), 'name cannot contain colons').optional().openapi({ description: 'Name of the guest player', example: 'Alice' }),
  }).optional(),
});

export type GuestTokenSchemaType = typeof guestTokenSchema;
