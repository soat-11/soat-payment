import { ValueObject } from '@core/domain/value-objects/value-object.vo';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentTypeInvalidException } from '@payment/domain/exceptions/payment.exception';

export class PaymentTypeVO extends ValueObject<PaymentType> {
  protected validate(input: PaymentType): void {
    const isValid = Object.values(PaymentType).includes(input);
    if (!isValid) {
      throw new PaymentTypeInvalidException(input);
    }
  }

  static create(type: PaymentType): PaymentTypeVO {
    return new PaymentTypeVO(type);
  }
}
