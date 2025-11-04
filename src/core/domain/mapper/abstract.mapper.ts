import { Result } from '@core/domain/result';
import { DefaultORMEntity } from '@core/infra/database/typeorm/default-orm.entity';
import { DefaultEntity } from '../default-entity';

export class MapperException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MapperException';
  }
}

export abstract class AbstractMapper<
  TORM extends DefaultORMEntity,
  TDomain extends DefaultEntity,
> {
  abstract toDomain(orm: TORM): Result<TDomain>;
  abstract toORM(domain: TDomain): Result<TORM>;
}
