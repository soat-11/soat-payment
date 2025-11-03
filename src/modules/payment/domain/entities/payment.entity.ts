import { AggregateRoot } from '@core/domain/aggregate-root';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentStatusVO } from '@payment/domain/value-objects/payment-status.vo';
import { PaymentDetailEntity } from './payment-detail.entity';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { PixDetail } from '../value-objects/pix-detail.vo';

export type PaymentProps = {
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
};

export class PaymentEntity extends AggregateRoot<PaymentEntity> {
  public paymentDetail?: PaymentDetailEntity;

  public readonly expiresAt: Date;

  private constructor(
    readonly id: UniqueEntityID,
    public readonly amount: number,
    public readonly status: PaymentStatus,
    public readonly type: PaymentType,
  ) {
    super(id);
    Object.freeze(this);
  }

  static create(props: PaymentProps): PaymentEntity {
    const status = PaymentStatusVO.create(props.status);
    const payment = new PaymentEntity(
      UniqueEntityID.create(),
      props.amount,
      status.value,
      props.type,
    );

    return payment;
  }

  static fromPersistence(
    id: UniqueEntityID,
    props: PaymentProps,
  ): PaymentEntity {
    return new PaymentEntity(id, props.amount, props.status, props.type);
  }

  addPaymentDetail(detail: PixDetail): this {
    // Strategy pattern vai ser implementado futuramente para suportar outros tipos de pagamento
    if (this.type !== PaymentType.PIX) {
      throw new DomainBusinessException(
        'Tipo de detalhe de pagamento inválido',
      );
    }

    this.paymentDetail = PaymentDetailEntity.createPixDetail(this.id, {
      expiresAt: detail.value.expiresAt,
      pixKey: detail.value.pixKey,
      qrCode: detail.value.qrCode,
    });

    return this;
  }
}
