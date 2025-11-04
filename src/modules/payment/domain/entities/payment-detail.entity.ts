import { DefaultEntity } from '@core/domain/default-entity';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PixDetail, PixDetailProps } from '../value-objects/pix-detail.vo';

export class PaymentDetailEntity extends DefaultEntity {
  private constructor(
    id: UniqueEntityID,
    public readonly paymentId: UniqueEntityID,
    public readonly info: PixDetail,
  ) {
    super(id);
    Object.freeze(this);
  }

  static createPixDetail(
    paymentId: UniqueEntityID,
    detail: PixDetailProps,
  ): PaymentDetailEntity {
    const details = PixDetail.create(detail);

    const paymentDetailEntity = new PaymentDetailEntity(
      UniqueEntityID.create(),
      paymentId,
      details,
    );

    return paymentDetailEntity;
  }

  static fromPixDetailPersistence(
    id: UniqueEntityID,
    paymentId: UniqueEntityID,
    detail: PixDetailProps,
  ): PaymentDetailEntity {
    const details = PixDetail.create(detail);

    const paymentDetailEntity = new PaymentDetailEntity(id, paymentId, details);

    return paymentDetailEntity;
  }

  getQrCode(): string {
    return this.info.value.qrCode;
  }
}
