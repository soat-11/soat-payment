import { Result } from '@core/domain/result';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentMongoDBEntity } from '../entities/payment-mongodb.entity';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { AbstractMapper } from '@core/domain/mapper/abstract.mapper';

export class PaymentMapper extends AbstractMapper<
  PaymentMongoDBEntity,
  PaymentEntity
> {
  toDomain(orm: PaymentMongoDBEntity): Result<PaymentEntity> {
    try {
      let payment = PaymentEntity.fromPersistence(orm.id, {
        amount: orm.amount,
        type: orm.type,
        status: orm.status,
        expiresAt: orm.expiresAt,
      });

      if (orm.provider && orm.externalPaymentId) {
        payment = payment.addPaymentProvider({
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
      orm.createdAt = domain.createdAt;
      orm.updatedAt = domain.updatedAt;

      orm.provider = domain.paymentProvider?.value.provider;
      orm.externalPaymentId =
        domain.paymentProvider?.value.externalPaymentId ?? null;

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
}
