import { ValueObject } from '@core/domain/value-objects/value-object.vo';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';

export abstract class PaymentDetailVO<T = any> extends ValueObject<T> {
  abstract get paymentType(): PaymentType;

  abstract toSummary(): string;
}

export type PaymentDetailMap = {
  [PaymentType.PIX]: PixDetailVO;
  // [PaymentType.DEBIT]: DebitDetailVO;
};

export type AnyPaymentDetail = PaymentDetailMap[keyof PaymentDetailMap];

export function isPixDetail(detail: AnyPaymentDetail): detail is PixDetailVO {
  return detail.paymentType === PaymentType.PIX;
}

export function isDetailOfType<T extends PaymentType>(
  detail: AnyPaymentDetail,
  type: T,
): detail is PaymentDetailMap[T] {
  return detail.paymentType === type;
}
