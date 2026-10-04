import type { IdGenerator } from '../../usecases/ports/id-generator.port.js';
import { ObjectId } from 'mongodb';

export class MongoIdGenerator implements IdGenerator {
  public generate(): string {
    return new ObjectId().toHexString();
  }
}
