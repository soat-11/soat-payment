import { AbstractMapper } from '@core/domain/mapper/abstract.mapper';
import { PaymentTypeORMEntity } from '../entities/payment-typeorm.entity';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { Result } from '@core/domain/result';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';

export class PaymentMapper extends AbstractMapper<
  PaymentTypeORMEntity,
  PaymentEntity
> {
  toDomain(orm: PaymentTypeORMEntity): Result<PaymentEntity> {
    try {
      let result: PaymentEntity;
      result = PaymentEntity.fromPersistence(orm.id, {
        amount: orm.amount,
        type: orm.type,
        expiresAt: orm.expiresAt,
        status: orm.status,
      });

      if (orm.provider && orm.externalPaymentId) {
        result = result.addPaymentProvider({
          externalPaymentId: orm.externalPaymentId,
          provider: orm.provider,
        });
      }

      return Result.ok(result);
    } catch (e) {
      if (e instanceof Error) {
        return Result.fail(e);
      }
      return Result.fail(
        new DomainBusinessException('Erro ao converter ORM pagamento'),
      );
    }
  }

  toORM(domain: PaymentEntity): Result<PaymentTypeORMEntity> {
    try {
      const orm = new PaymentTypeORMEntity();
      orm.id = domain.id;
      orm.amount = domain.amount.value;
      orm.type = domain.type.value;
      orm.status = domain.status.value;
      orm.expiresAt = domain.expiresAt;

      orm.provider = domain.paymentProvider?.value.provider;
      orm.externalPaymentId =
        domain.paymentProvider?.value.externalPaymentId ?? null;

      return Result.ok(orm);
    } catch (e) {
      if (e instanceof Error) {
        return Result.fail(e);
      }
      return Result.fail(
        new DomainBusinessException('Erro ao converter ORM pagamento'),
      );
    }
  }
}
