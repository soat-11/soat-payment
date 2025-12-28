import { ValueObject } from '@core/domain/value-objects/value-object.vo';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentStatusInvalidException } from '@payment/domain/exceptions/payment.exception';

export class PaymentStatusVO extends ValueObject<PaymentStatus> {
  protected validate(input: PaymentStatus): void {
    const isValidStatus = Object.values(PaymentStatus).includes(input);

    if (!isValidStatus) {
      throw new PaymentStatusInvalidException(input);
    }
  }

  static create(status: PaymentStatus): PaymentStatusVO {
    return new PaymentStatusVO(status);
  }
}
