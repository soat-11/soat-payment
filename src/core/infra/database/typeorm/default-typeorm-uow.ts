import { UnitOfWork } from '@core/infra/database/persistence/unit-of-work';

import { DataSource, QueryRunner } from 'typeorm';
export abstract class DefaultTypeormUnitOfWork implements UnitOfWork {
  private queryRunner: QueryRunner;

  constructor(private readonly dataSource: DataSource) {}

  async start(): Promise<void> {
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
  }

  async commit(): Promise<void> {
    await this.queryRunner.commitTransaction();
    await this.queryRunner.release();
  }

  async rollback(): Promise<void> {
    await this.queryRunner.rollbackTransaction();
    await this.queryRunner.release();
  }
}
