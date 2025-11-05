import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';

import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PaymentTypeORMEntity } from '../entities/payment-typeorm.entity';

import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { PaymentMapper } from '../mapper/payment.mapper';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { DomainPersistenceException } from '@core/domain/exceptions/domain.exception';

export class PaymentRepositoryImpl implements PaymentRepository {
  private transactionalManager: EntityManager | null = null;

  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentMapper: PaymentMapper,
    private readonly logger: AbstractLoggerService,
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
    try {
      this.logger.log('Saving payment', { payment });
      const orm = this.paymentMapper.toORM(payment);
      if (orm.isFailure) {
        this.logger.error('Error saving payment', { error: orm.error });
        throw orm.error;
      }
      this.logger.log('Payment mapped to ORM', { orm: orm.value });
      const manager = this.getManager();

      await manager.save(PaymentTypeORMEntity, orm.value);
      this.logger.log('Payment saved', { payment: orm.value });
      return;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error saving payment', {
          message: error.message,
          trace: error.stack,
        });
        throw new DomainPersistenceException('Erro ao salvar pagamento');
      }
      this.logger.error('Error saving payment', {
        message: 'Unknown error saving payment',
        trace: 'Unknown error saving payment',
      });
      throw new DomainPersistenceException('Erro salvar pagamento');
    }
  }

  async findById(id: UniqueEntityID): Promise<PaymentEntity | null> {
    const result = await this.getManager().findOneBy(PaymentTypeORMEntity, {
      id: id,
    });

    if (!result) return null;
    return this.paymentMapper.toDomain(result).value;
  }
}
