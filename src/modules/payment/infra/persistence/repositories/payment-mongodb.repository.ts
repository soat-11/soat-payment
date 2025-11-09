import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';

import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PaymentMongoDBEntity } from '../entities/payment-mongodb.entity';

import { MongoRepository } from 'typeorm';
import { PaymentMapper } from '../mapper/payment.mapper';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { DomainPersistenceException } from '@core/domain/exceptions/domain.exception';

export class PaymentMongoDBRepositoryImpl implements PaymentRepository {
  constructor(
    private readonly mongoRepository: MongoRepository<PaymentMongoDBEntity>,
    private readonly paymentMapper: PaymentMapper,
    private readonly logger: AbstractLoggerService,
  ) {}

  async save(payment: PaymentEntity): Promise<void> {
    try {
      this.logger.log('Saving payment', { paymentId: payment.id.value });

      const orm = this.paymentMapper.toORM(payment);
      if (orm.isFailure) {
        this.logger.error('Error mapping payment to ORM', { error: orm.error });
        throw orm.error;
      }

      this.logger.log('Payment mapped to ORM', { paymentId: payment.id.value });

      await this.mongoRepository.save(orm.value);

      this.logger.log('Payment saved', { paymentId: payment.id.value });
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
      const result = await this.mongoRepository.findOne({
        where: {
          id: id,
        },
      });

      if (!result) {
        this.logger.log('Payment not found', { paymentId: id.value });
        return null;
      }

      const domain = this.paymentMapper.toDomain(result);
      if (domain.isFailure) {
        this.logger.error('Error mapping payment to domain', {
          error: domain.error,
        });
        throw domain.error;
      }

      return domain.value;
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
}
