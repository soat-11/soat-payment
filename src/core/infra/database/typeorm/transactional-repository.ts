import { QueryRunner } from 'typeorm';

export interface TransactionalRepository {
  setTransactionalManager(queryRunner: QueryRunner): void;
  clearTransactionalManager(): void;
}
