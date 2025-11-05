import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { PixDetailMapper } from '../mapper/pix-detail.mapper';
import { PixDetailORMEntity } from '../entities/pix-detail-typeorm.entity';

import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentDetailEntity } from '@payment/domain/entities/payment-detail.entity';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { DomainPersistenceException } from '@core/domain/exceptions/domain.exception';

export interface PaymentDetailRepository {
  save(detail: PaymentDetailEntity): Promise<void>;
  findByPaymentId(
    paymentId: UniqueEntityID,
  ): Promise<PaymentDetailEntity | null>;
}

export class PaymentDetailRepositoryImpl implements PaymentDetailRepository {
  private transactionalManager: EntityManager | null = null;

  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentDetailMapper: PixDetailMapper,
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

  async save(detail: PaymentDetailEntity): Promise<void> {
    try {
      const orm = this.paymentDetailMapper.toORM(detail);
      if (orm.isFailure) {
        this.logger.error('Error saving payment detail');
        throw orm.error;
      }
      this.logger.log('Payment detail mapped to ORM');
      const manager = this.getManager();
      await manager.save(PixDetailORMEntity, orm.value);
      this.logger.log('Payment detail saved');
      return;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error saving payment detail', {
          message: error.message,
          trace: error.stack,
        });
        throw new DomainPersistenceException(
          'Erro ao salvar detalhe de pagamento',
        );
      }
      this.logger.error('Error saving payment detail', {
        message: 'Unknown error saving payment detail',
        trace: 'Unknown error saving payment detail',
      });
      throw new DomainPersistenceException(
        'Erro ao salvar detalhe de pagamento',
      );
    }
  }

  async findByPaymentId(
    paymentId: UniqueEntityID,
  ): Promise<PaymentDetailEntity | null> {
    const orm = await this.getManager().findOneBy(PixDetailORMEntity, {
      paymentId,
    });
    if (!orm) return null;

    const domain = this.paymentDetailMapper.toDomain(orm);

    if (domain.isFailure) throw domain.error;
    return domain.value;
  }
}
