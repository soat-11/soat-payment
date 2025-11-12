import { AggregateRoot } from '@core/domain/aggregate-root';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentStatusVO } from '@payment/domain/value-objects/payment-status.vo';

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
import {
  PaymentAlreadyPaidException,
  PaymentDetailInvalidException,
  PaymentExpiredException,
  PaymentProviderNotProvidedException,
} from '@payment/domain/exceptions/payment.exception';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';
import { SessionIdVO } from '@payment/domain/value-objects/session-id.vo';

export type PaymentProps = {
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  idempotencyKey: string;
  sessionId: string;
};

export class PaymentEntity extends AggregateRoot<PaymentEntity> {
  private _detail?: AnyPaymentDetail;
  public status: PaymentStatusVO;
  public paymentProvider?: PaymentProvider;
  public idempotencyKey: IdempotencyKeyVO;
  public sessionId: SessionIdVO;
  public expiresAt: Date;

  private constructor(
    readonly id: UniqueEntityID,
    public amount: PaymentAmountVO,
    public type: PaymentTypeVO,
    expiresAt: Date,
    idempotencyKey: IdempotencyKeyVO,
    sessionId: SessionIdVO,
  ) {
    super(id);
    this.status = PaymentStatusVO.create(PaymentStatus.PENDING);
    this.expiresAt = expiresAt;
    this.idempotencyKey = idempotencyKey;
    this.sessionId = sessionId;
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
      IdempotencyKeyVO.create(props.idempotencyKey),
      SessionIdVO.create(props.sessionId),
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
    const payment = new PaymentEntity(
      id,
      amount,
      type,
      props.expiresAt,
      IdempotencyKeyVO.create(props.idempotencyKey),
      SessionIdVO.create(props.sessionId),
    );
    payment.status = PaymentStatusVO.create(props.status);
    return payment;
  }

  addPaymentDetail(detail: AnyPaymentDetail): this {
    if (this.type.value !== detail.paymentType) {
      throw new PaymentDetailInvalidException(
        this.type.value,
        detail.paymentType,
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
      throw new PaymentAlreadyPaidException();
    }

    if (this.paymentProvider == null) {
      throw new PaymentProviderNotProvidedException();
    }

    if (currentDate > this.expiresAt) {
      throw new PaymentExpiredException();
    }

    this.status = PaymentStatusVO.create(PaymentStatus.PAID);
    this.addDomainEvent(new PaymentPaidEvent(this));
  }
}
