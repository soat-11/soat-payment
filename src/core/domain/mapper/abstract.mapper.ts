import { Result } from '@core/domain/result';

import { DefaultEntity } from '../default-entity';

import { DefaultORMEntity } from '@core/infra/database/typeorm/default-orm.entity';
import { AggregateRoot } from '../aggregate-root';

export class MapperException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MapperException';
  }
}

export abstract class AbstractMapper<
  TORM extends DefaultORMEntity,
  TDomain extends AggregateRoot<DefaultEntity>,
> {
  abstract toDomain(orm: TORM): Result<TDomain>;
  abstract toORM(domain: TDomain): Result<TORM>;
}
