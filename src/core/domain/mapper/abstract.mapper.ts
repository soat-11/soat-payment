import { DefaultEntity } from '@core/domain/default-entity';
import { Result } from '@core/domain/result';


export class MapperException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MapperException';
  }
}

export abstract class AbstractMapper<
  TORM extends object,
  TDomain extends DefaultEntity,
> {
  abstract toDomain(orm: TORM): Result<TDomain>;
  abstract toORM(domain: TDomain): Result<TORM>;
}
