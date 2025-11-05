import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';

import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PaymentTypeORMEntity } from '../entities/payment-typeorm.entity';

import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { PaymentMapper } from '../mapper/payment.mapper';

export class PaymentRepositoryImpl implements PaymentRepository {
  private transactionalManager: EntityManager | null = null;

  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentMapper: PaymentMapper,
  ) {}

  setTransactionalManager(queryRunner: QueryRunner): void {
    this.transactionalManager = queryRunner.manager;
  }

  clearTransactionalManager(): void {
    this.transactionalManager = null;
  }

  private getManager(): EntityManager {
    return this.transactionalManager ?? this.dataSource.manager;
  }

  async save(payment: PaymentEntity): Promise<void> {
    const orm = this.paymentMapper.toORM(payment);
    if (orm.isFailure) throw orm.error;
    const manager = this.getManager();
    await manager.save(PaymentTypeORMEntity, orm.value);

    return;
  }

  async findById(id: UniqueEntityID): Promise<PaymentEntity | null> {
    const result = await this.getManager().findOneBy(PaymentTypeORMEntity, {
      id: id,
    });

    if (!result) return null;
    return this.paymentMapper.toDomain(result).value;
  }
}
