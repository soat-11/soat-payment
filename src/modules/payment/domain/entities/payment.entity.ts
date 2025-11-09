import { AggregateRoot } from '@core/domain/aggregate-root';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentStatusVO } from '@payment/domain/value-objects/payment-status.vo';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { PixDetailVO } from '../value-objects/pix-detail.vo';
import { PaymentTypeVO } from '../value-objects/payment-type.vo';
import { PaymentAmountVO } from '../value-objects/payment-amount.vo';
import { PaymentCreatedEvent } from '../events/payment-created.event';
import { PaymentPaidEvent } from '../events/payment-paid.event';
import {
  PaymentProvider,
  PaymentProviderProps,
} from '../value-objects/payment-provider.vo';
import {
  AnyPaymentDetail,
  isPixDetail,
} from '@payment/domain/value-objects/payment-detail.vo';

export type PaymentProps = {
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
};

export class PaymentEntity extends AggregateRoot<PaymentEntity> {
  private _detail?: AnyPaymentDetail;
  public status: PaymentStatusVO;
  public paymentProvider?: PaymentProvider;
  public expiresAt: Date;

  private constructor(
    readonly id: UniqueEntityID,
    public amount: PaymentAmountVO,
    public type: PaymentTypeVO,
    expiresAt: Date,
  ) {
    super(id);
    this.status = PaymentStatusVO.create(PaymentStatus.PENDING);
    this.expiresAt = expiresAt;
    // Object.freeze(this);
  }

  get detail(): AnyPaymentDetail | undefined {
    return this._detail;
  }

  get pixDetail(): PixDetailVO | undefined {
    return this._detail && isPixDetail(this._detail) ? this._detail : undefined;
  }

  get isPix(): boolean {
    return this.type.value === PaymentType.PIX;
  }

  static create(
    props: Omit<PaymentProps, 'status'> & { expiresAt: Date },
  ): PaymentEntity {
    const type = PaymentTypeVO.create(props.type);
    const amount = PaymentAmountVO.create(props.amount);

    const payment = new PaymentEntity(
      UniqueEntityID.create(),
      amount,
      type,
      props.expiresAt,
    );
    payment.addDomainEvent(new PaymentCreatedEvent(payment));

    return payment;
  }

  static fromPersistence(
    id: UniqueEntityID,
    props: PaymentProps & { expiresAt: Date },
  ): PaymentEntity {
    const type = PaymentTypeVO.create(props.type);
    const amount = PaymentAmountVO.create(props.amount);
    const payment = new PaymentEntity(id, amount, type, props.expiresAt);
    payment.status = PaymentStatusVO.create(props.status);
    return payment;
  }

  addPaymentDetail(detail: AnyPaymentDetail): this {
    if (this.type.value !== detail.paymentType) {
      throw new DomainBusinessException(
        `Tipo de detalhe inválido: esperado ${this.type.value}, recebido ${detail.paymentType}`,
      );
    }

    this._detail = detail;
    return this;
  }

  addPaymentProvider(provider: PaymentProviderProps): this {
    this.paymentProvider = PaymentProvider.create(provider);
    return this;
  }

  paid(currentDate: Date): void {
    if (this.status.value === PaymentStatus.PAID) {
      throw new DomainBusinessException('Pagamento já está como PAGO');
    }

    if (this.paymentProvider == null) {
      throw new DomainBusinessException('Provedor de pagamento não informado');
    }

    if (currentDate > this.expiresAt) {
      throw new DomainBusinessException(
        'Não é possível pagar um pagamento expirado',
      );
    }

    this.status = PaymentStatusVO.create(PaymentStatus.PAID);
    this.addDomainEvent(new PaymentPaidEvent(this));
  }
}
