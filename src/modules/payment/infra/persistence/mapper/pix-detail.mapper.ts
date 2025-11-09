import { Result } from '@core/domain/result';
import { AbstractMapper } from '@core/domain/mapper/abstract.mapper';
import { PixDetailMongoDBEntity } from '../entities/pix-detail-mongodb.entity';

import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';

export class PixDetailMapper extends AbstractMapper<
  PixDetailMongoDBEntity,
  PaymentDetailEntity
> {
  toDomain(orm: PixDetailMongoDBEntity): Result<PaymentDetailEntity> {
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

  toORM(domain: PaymentDetailEntity): Result<PixDetailMongoDBEntity> {
    try {
      const orm = new PixDetailMongoDBEntity();
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
