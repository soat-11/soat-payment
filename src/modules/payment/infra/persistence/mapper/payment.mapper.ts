import { Result } from '@core/domain/result';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentTypeORMEntity } from '../entities/payment-typeorm.entity';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { AbstractMapper } from '@core/domain/mapper/abstract.mapper';

export class PaymentMapper extends AbstractMapper<
  PaymentTypeORMEntity,
  PaymentEntity
> {
  toDomain(orm: PaymentTypeORMEntity): Result<PaymentEntity> {
    try {
      const payment = PaymentEntity.fromPersistence(orm.id, {
        amount: orm.amount,
        type: orm.type,
        status: orm.status,
        expiresAt: orm.expiresAt,
      });

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

  toORM(domain: PaymentEntity): Result<PaymentTypeORMEntity> {
    try {
      const orm = new PaymentTypeORMEntity();
      orm.id = domain.id;
      orm.amount = domain.amount.value;
      orm.type = domain.type.value;
      orm.status = domain.status.value;
      orm.expiresAt = domain.expiresAt;

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
