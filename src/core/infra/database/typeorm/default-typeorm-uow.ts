import { DomainPersistenceException } from '@core/domain/exceptions/domain.exception';
import { UnitOfWork } from '@core/infra/database/persistence/unit-of-work';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';

import { DataSource, QueryRunner } from 'typeorm';
export abstract class DefaultTypeormUnitOfWork implements UnitOfWork {
  private queryRunner: QueryRunner;

  constructor(
    protected readonly dataSource: DataSource,
    protected readonly logger: AbstractLoggerService,
  ) {}

  getQueryRunner(): QueryRunner {
    this.logger.log('Getting query runner');
    if (!this.queryRunner) {
      this.logger.error('Query runner not found');
      throw new DomainPersistenceException(
        'Transaction not started. Call start() first.',
      );
    }
    this.logger.log('Query runner obtained');
    return this.queryRunner;
  }

  async start(): Promise<void> {
    this.logger.log('Starting transaction');
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    this.logger.log('Transaction started');
  }

  async commit(): Promise<void> {
    this.logger.log('Committing transaction');
    await this.queryRunner.commitTransaction();
    await this.queryRunner.release();
    this.logger.log('Transaction committed');
  }

  async rollback(): Promise<void> {
    this.logger.log('Rolling back transaction');
    await this.queryRunner.rollbackTransaction();
    await this.queryRunner.release();
    this.logger.log('Transaction rolled back');
  }
}
