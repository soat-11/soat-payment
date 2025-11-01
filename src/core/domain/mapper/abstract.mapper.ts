import { Result } from '@core/domain/result';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';

export class MapperException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MapperException';
  }
}

export abstract class AbstractMapper<
  TORM extends object = {
    id: UniqueEntityID;
  },
  TDomain extends object = { id: UniqueEntityID },
> {
  abstract toDomain(orm: TORM): Result<TDomain>;
  abstract toORM(domain: TDomain): Result<TORM>;
}
