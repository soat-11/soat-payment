import { AggregateRoot } from '@core/domain/aggregate-root';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentStatusVO } from '@payment/domain/value-objects/payment-status.vo';
import { PaymentDetailEntity } from './payment-detail.entity';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { PixDetail } from '../value-objects/pix-detail.vo';
import { PaymentTypeVO } from '../value-objects/payment-type.vo';
import { PaymentAmountVO } from '../value-objects/payment-amount.vo';
import { PaymentExpiredAtDomainServiceImpl } from '../service/payment-expired-at.service';
import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { PaymentCreatedEvent } from '../events/payment-created.event';
import { PaymentPaidEvent } from '../events/payment-paid.event';
import {
  PaymentProvider,
  PaymentProviderProps,
} from '../value-objects/payment-provider.vo';

export type PaymentProps = {
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
};

export class PaymentEntity extends AggregateRoot<PaymentEntity> {
  public paymentDetail?: PaymentDetailEntity;
  public status: PaymentStatusVO;
  public paymentProvider?: PaymentProvider;
  public expiresAt: Date;

  private constructor(
    readonly id: UniqueEntityID,
    public amount: PaymentAmountVO,
    public type: PaymentTypeVO,
  ) {
    super(id);
    this.status = PaymentStatusVO.create(PaymentStatus.PENDING);
    this.expiresAt = new PaymentExpiredAtDomainServiceImpl(
      new SystemDateImpl(new Date()),
    ).execute().date;
    // Object.freeze(this);
  }

  static create(props: Omit<PaymentProps, 'status'>): PaymentEntity {
    const type = PaymentTypeVO.create(props.type);
    const amount = PaymentAmountVO.create(props.amount);

    const payment = new PaymentEntity(UniqueEntityID.create(), amount, type);
    payment.addDomainEvent(new PaymentCreatedEvent(payment));

    return payment;
  }

  static fromPersistence(
    id: UniqueEntityID,
    props: PaymentProps & { expiresAt: Date },
  ): PaymentEntity {
    const type = PaymentTypeVO.create(props.type);
    const amount = PaymentAmountVO.create(props.amount);
    const payment = new PaymentEntity(id, amount, type);
    payment.status = PaymentStatusVO.create(props.status);
    payment.expiresAt = props.expiresAt;
    return payment;
  }

  addPaymentDetail(detail: PixDetail): this {
    // Strategy pattern vai ser implementado futuramente para suportar outros tipos de pagamento
    if (this.type.value !== PaymentType.PIX) {
      throw new DomainBusinessException(
        'Tipo de detalhe de pagamento inválido',
      );
    }

    this.paymentDetail = PaymentDetailEntity.createPixDetail(this.id, {
      qrCode: detail.value.qrCode,
    });

    return this;
  }

  addPaymentProvider(provider: PaymentProviderProps): this {
    this.paymentProvider = PaymentProvider.create(provider);
    return this;
  }

  paid(): void {
    if (this.status.value === PaymentStatus.PAID) {
      throw new DomainBusinessException('Pagamento já está como PAGO');
    }

    if (this.paymentProvider == null) {
      throw new DomainBusinessException('Provedor de pagamento não informado');
    }

    const now = new Date();
    if (now > this.expiresAt) {
      throw new DomainBusinessException(
        'Não é possível pagar um pagamento expirado',
      );
    }

    this.status = PaymentStatusVO.create(PaymentStatus.PAID);
    this.addDomainEvent(new PaymentPaidEvent(this));
  }
}
