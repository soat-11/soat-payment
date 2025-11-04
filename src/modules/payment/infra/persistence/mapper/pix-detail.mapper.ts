import { Result } from '@core/domain/result';
import { AbstractMapper } from '@core/domain/mapper/abstract.mapper';
import { PixDetailORMEntity } from '../entities/pix-detail-typeorm.entity';
import { PaymentDetailEntity } from '@payment/domain/entities/payment-detail.entity';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';

export class PixDetailMapper extends AbstractMapper<
  PixDetailORMEntity,
  PaymentDetailEntity
> {
  toDomain(orm: PixDetailORMEntity): Result<PaymentDetailEntity> {
    try {
      const paymentDetail = PaymentDetailEntity.fromPixDetailPersistence(
        orm.id,
        orm.paymentId,
        {
          qrCode: orm.qrCode,
        },
      );

      return Result.ok(paymentDetail);
    } catch (e) {
      if (e instanceof Error) {
        return Result.fail(e);
      }
      return Result.fail(
        new DomainBusinessException(
          'Erro ao converter ORM detalhe de pagamento Pix',
        ),
      );
    }
  }

  toORM(domain: PaymentDetailEntity): Result<PixDetailORMEntity> {
    try {
      const orm = new PixDetailORMEntity();
      orm.id = domain.id;
      orm.paymentId = domain.paymentId;
      orm.qrCode = domain.getQrCode();

      return Result.ok(orm);
    } catch (e) {
      if (e instanceof Error) {
        return Result.fail(e);
      }
      return Result.fail(
        new DomainBusinessException(
          'Erro ao converter ORM detalhe de pagamento Pix',
        ),
      );
    }
  }
}
