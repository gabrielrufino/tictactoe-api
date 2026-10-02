import type { IdGenerator } from '../../usecases/ports/id-generator.js';
import { randomUUID } from 'node:crypto';

export class UUIDIdGenerator implements IdGenerator {
  public generate(): string {
    return randomUUID();
  }
}
