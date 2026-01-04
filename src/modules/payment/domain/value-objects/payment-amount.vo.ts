import { ValueObject } from '@core/domain/value-objects/value-object.vo';
import { PaymentAmountInvalidException } from '@payment/domain/exceptions/payment.exception';

export class PaymentAmountVO extends ValueObject<number> {
  constructor(value: number) {
    super(value);
  }

  protected validate(value: number): void {
    if (value <= 0) {
      throw new PaymentAmountInvalidException(value);
    }
  }

  static create(value: number): PaymentAmountVO {
    return new PaymentAmountVO(value);
  }
}
