import { MongoRepository } from 'typeorm';

import { DomainPersistenceException } from '@core/domain/exceptions/domain.exception';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PaymentMongoDBEntity } from '@modules/payment/infra/persistence/entities/payment-mongodb.entity';
import { PaymentDetailMapperFactory } from '@modules/payment/infra/persistence/mapper/payment-detail-mapper.factory';
import { PaymentMapper } from '@modules/payment/infra/persistence/mapper/payment.mapper';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';

export class PaymentMongoDBRepositoryImpl implements PaymentRepository {
  constructor(
    private readonly paymentMongoRepository: MongoRepository<PaymentMongoDBEntity>,
    private readonly paymentMapper: PaymentMapper,
    private readonly detailMapperFactory: PaymentDetailMapperFactory,
    private readonly logger: AbstractLoggerService,
  ) {}

  async save(payment: PaymentEntity): Promise<void> {
    try {
      this.logger.log('Saving payment', { paymentId: payment.id.value });

      if (!payment.detail) {
        this.logger.error('Error saving payment', {
          message: 'Detalhe de pagamento não encontrado',
        });

        throw new DomainPersistenceException(
          'Detalhe de pagamento não encontrado',
        );
      }

      const detailOrmResult = this.detailMapperFactory.toORM(
        payment.detail,
        payment.id.value,
      );

      if (detailOrmResult.isFailure) {
        this.logger.error('Error mapping payment detail to ORM', {
          error: detailOrmResult.error,
        });
        throw detailOrmResult.error;
      }

      const paymentOrmResult = this.paymentMapper.toORM(payment);

      if (paymentOrmResult.isFailure) {
        this.logger.error('Error mapping payment to ORM', {
          error: paymentOrmResult.error,
        });
        throw paymentOrmResult.error;
      }

      const detailRepositoryResult = this.detailMapperFactory.getRepository(
        payment.detail.paymentType,
      );

      if (detailRepositoryResult.isFailure) {
        this.logger.error('Error getting detail repository', {
          error: detailRepositoryResult.error,
        });
        throw detailRepositoryResult.error;
      }

      const detailRepository = detailRepositoryResult.value;

      await this.paymentMongoRepository.save(paymentOrmResult.value);
      this.logger.log('Payment saved', { paymentId: payment.id.value });

      this.logger.log('Saving payment detail', {
        paymentId: payment.id.value,
        type: payment.detail.paymentType,
      });

      await detailRepository.save(detailOrmResult.value);
      this.logger.log('Payment detail saved', {
        paymentId: payment.id.value,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error saving payment', {
          message: error.message,
          trace: error.stack,
        });
        throw new DomainPersistenceException('Erro ao salvar pagamento');
      }

      this.logger.error('Unknown error saving payment');
      throw new DomainPersistenceException('Erro ao salvar pagamento');
    }
  }

  async findById(id: UniqueEntityID): Promise<PaymentEntity | null> {
    try {
      const paymentOrm = await this.paymentMongoRepository.findOne({
        where: {
          id: id,
        },
      });

      if (!paymentOrm) {
        this.logger.log('Payment not found', { paymentId: id.value });
        return null;
      }

      const paymentResult = this.paymentMapper.toDomain(paymentOrm);
      if (paymentResult.isFailure) {
        this.logger.error('Error mapping payment to domain', {
          error: paymentResult.error,
        });
        throw paymentResult.error;
      }

      const payment = paymentResult.value;

      const detailRepositoryResult = this.detailMapperFactory.getRepository(
        payment.type.value,
      );

      if (detailRepositoryResult.isSuccess) {
        const detailRepository = detailRepositoryResult.value;

        this.logger.log('Loading payment detail', {
          paymentId: id.value,
          type: payment.type.value,
        });

        const detailOrm = await detailRepository.findOne({
          where: { paymentId: id },
        });

        if (detailOrm) {
          const detailResult = this.detailMapperFactory.toDomain(
            detailOrm,
            payment.type.value,
          );

          if (detailResult.isFailure) {
            this.logger.error('Error mapping payment detail to domain', {
              error: detailResult.error,
            });
            throw detailResult.error;
          }

          payment.addPaymentDetail(detailResult.value);
        }
      }

      return payment;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error finding payment', {
          message: error.message,
          trace: error.stack,
        });
      }
      throw error;
    }
  }

  async findByIdempotencyKey(
    idempotencyKey: IdempotencyKeyVO,
  ): Promise<PaymentEntity | null> {
    try {
      const paymentOrm = await this.paymentMongoRepository.findOne({
        where: { idempotencyKey: idempotencyKey.value },
      });

      if (!paymentOrm) {
        this.logger.log('Payment not found', {
          idempotencyKey: idempotencyKey.value,
        });
        return null;
      }

      const paymentResult = this.paymentMapper.toDomain(paymentOrm);
      if (paymentResult.isFailure) {
        this.logger.error('Error mapping payment to domain', {
          error: paymentResult.error,
        });
        throw paymentResult.error;
      }

      const payment = paymentResult.value;

      const detailRepositoryResult = this.detailMapperFactory.getRepository(
        payment.type.value,
      );

      if (detailRepositoryResult.isSuccess) {
        const detailRepository = detailRepositoryResult.value;

        this.logger.log('Loading payment detail', {
          paymentId: payment.id.value,
          type: payment.type.value,
        });

        const detailOrm = await detailRepository.findOne({
          where: { paymentId: payment.id },
        });

        if (detailOrm) {
          const detailResult = this.detailMapperFactory.toDomain(
            detailOrm,
            payment.type.value,
          );

          if (detailResult.isFailure) {
            this.logger.error('Error mapping payment detail to domain', {
              error: detailResult.error,
            });
            throw detailResult.error;
          }

          payment.addPaymentDetail(detailResult.value);
        }
      }

      return payment;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error finding payment by idempotency key', {
          message: error.message,
          trace: error.stack,
        });
        throw error;
      }
      throw new DomainPersistenceException('Erro ao buscar pagamento');
    }
  }

  async findByExternalPaymentId(
    externalPaymentId: string,
  ): Promise<PaymentEntity | null> {
    try {
      const paymentOrm = await this.paymentMongoRepository.findOne({
        where: { externalPaymentId: externalPaymentId },
      });

      if (!paymentOrm) {
        this.logger.log('Payment not found by external payment ID', {
          externalPaymentId,
        });
        return null;
      }

      const paymentResult = this.paymentMapper.toDomain(paymentOrm);
      if (paymentResult.isFailure) {
        this.logger.error('Error mapping payment to domain', {
          error: paymentResult.error,
        });
        throw paymentResult.error;
      }

      const payment = paymentResult.value;

      const detailRepositoryResult = this.detailMapperFactory.getRepository(
        payment.type.value,
      );

      if (detailRepositoryResult.isSuccess) {
        const detailRepository = detailRepositoryResult.value;

        this.logger.log('Loading payment detail', {
          paymentId: payment.id.value,
          type: payment.type.value,
        });

        const detailOrm = await detailRepository.findOne({
          where: { paymentId: payment.id },
        });

        if (detailOrm) {
          const detailResult = this.detailMapperFactory.toDomain(
            detailOrm,
            payment.type.value,
          );

          if (detailResult.isFailure) {
            this.logger.error('Error mapping payment detail to domain', {
              error: detailResult.error,
            });
            throw detailResult.error;
          }

          payment.addPaymentDetail(detailResult.value);
        }
      }

      return payment;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error finding payment by external payment ID', {
          message: error.message,
          trace: error.stack,
        });
        throw error;
      }
      throw new DomainPersistenceException('Erro ao buscar pagamento');
    }
  }

  async update(payment: PaymentEntity): Promise<void> {
    try {
      await this.paymentMongoRepository.update(
        {
          id: payment.id,
        },
        {
          amount: payment.amount.value,
          externalPaymentId: payment.paymentProvider?.value.externalPaymentId,
          provider: payment.paymentProvider?.value.provider,
          idempotencyKey: payment.idempotencyKey.value,
          status: payment.status.value,
          type: payment.type.value,
          expiresAt: payment.expiresAt,
          updatedAt: new Date(),
          sessionId: payment.sessionId.value,
          canceledAt: payment.canceledAt,
        },
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error updating payment', {
          message: error.message,
          trace: error.stack,
        });
        throw error;
      }
      throw new DomainPersistenceException('Erro ao atualizar pagamento');
    }
  }
}
