import { Result } from '@core/domain/result';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentMongoDBEntity } from '../entities/payment-mongodb.entity';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { AbstractMapper } from '@core/domain/mapper/abstract.mapper';
import { PaymentDetailMapperFactory } from './payment-detail-mapper.factory';
import { AnyPaymentDetail } from '@payment/domain/value-objects/payment-detail.vo';

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
        idempotencyKey: orm.idempotencyKey,
        sessionId: orm.sessionId,
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

      orm.idempotencyKey = domain.idempotencyKey.value;
      orm.sessionId = domain.sessionId.value;

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

  toDetailORM(payment: PaymentEntity): Result<AnyPaymentDetail | null> {
    if (!payment.detail) {
      return Result.ok(null);
    }

    return this.paymentDetailMapperFactory.toORM(
      payment.detail,
      payment.id.value,
    );
  }
}
