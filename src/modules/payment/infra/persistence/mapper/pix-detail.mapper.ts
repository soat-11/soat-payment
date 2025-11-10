import { Result } from '@core/domain/result';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
import { PixDetailMongoDBEntity } from '../entities/pix-detail-mongodb.entity';
import { PaymentDetailMapper } from './payment-detail.mapper.interface';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';

export class PixDetailMapper
  implements PaymentDetailMapper<PixDetailMongoDBEntity, PixDetailVO>
{
  readonly supportedType = PaymentType.PIX;

  toDomain(orm: PixDetailMongoDBEntity): Result<PixDetailVO> {
    try {
      const pixDetail = PixDetailVO.create({
        qrCode: orm.qrCode,
      });
      return Result.ok(pixDetail);
    } catch (e) {
      if (e instanceof Error) {
        return Result.fail(e);
      }
      return Result.fail(
        new DomainBusinessException('Erro ao converter PixDetail do ORM'),
      );
    }
  }

  toORM(
    domain: PixDetailVO,
    paymentId: string,
  ): Result<PixDetailMongoDBEntity> {
    try {
      const orm = new PixDetailMongoDBEntity();
      orm.id = UniqueEntityID.create();
      orm.paymentId = UniqueEntityID.create(paymentId);
      orm.qrCode = domain.qrCode;
      return Result.ok(orm);
    } catch (e) {
      if (e instanceof Error) {
        return Result.fail(e);
      }
      return Result.fail(
        new DomainBusinessException('Erro ao converter PixDetail para ORM'),
      );
    }
  }
}
