import { Result } from '@core/domain/result';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentMongoDBEntity } from '../entities/payment-mongodb.entity';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { AbstractMapper } from '@core/domain/mapper/abstract.mapper';
import { PaymentDetailMapperFactory } from './payment-detail-mapper.factory';

export class PaymentMapper extends AbstractMapper<
  PaymentMongoDBEntity,
  PaymentEntity
> {
  constructor(
    private readonly paymentDetailMapperFactory: PaymentDetailMapperFactory,
  ) {
    super();
  }

  toDomain(orm: PaymentMongoDBEntity): Result<PaymentEntity> {
    try {
      const payment = PaymentEntity.fromPersistence(orm.id, {
        amount: orm.amount,
        type: orm.type,
        status: orm.status,
        expiresAt: orm.expiresAt,
      });

      if (orm.provider && orm.externalPaymentId) {
        payment.addPaymentProvider({
          externalPaymentId: orm.externalPaymentId,
          provider: orm.provider,
        });
      }

      return Result.ok(payment);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      return Result.fail(
        new DomainBusinessException(
          'Ocorreu um erro desconhecido na conversão',
        ),
      );
    }
  }

  toORM(domain: PaymentEntity): Result<PaymentMongoDBEntity> {
    try {
      const orm = new PaymentMongoDBEntity();
      orm.id = domain.id;
      orm.amount = domain.amount.value;
      orm.type = domain.type.value;
      orm.status = domain.status.value;
      orm.expiresAt = domain.expiresAt;
      orm.provider = domain.paymentProvider?.value.provider;
      orm.externalPaymentId =
        domain.paymentProvider?.value.externalPaymentId ?? null;

      // NÃO converte detail aqui - isso é responsabilidade do repository
      // O repository deve pegar domain.detail e usar a factory separadamente

      return Result.ok(orm);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      return Result.fail(
        new DomainBusinessException(
          'Ocorreu um erro desconhecido na conversão',
        ),
      );
    }
  }

  /**
   * Helper method para converter PaymentDetail usando a factory
   * Mas quem chama é o REPOSITORY, não o mapper internamente
   */
  toDetailORM(payment: PaymentEntity): Result<any | null> {
    if (!payment.detail) {
      return Result.ok(null);
    }

    return this.paymentDetailMapperFactory.toORM(
      payment.detail,
      payment.id.value,
    );
  }
}
