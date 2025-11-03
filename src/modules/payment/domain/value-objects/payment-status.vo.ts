import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { ValueObject } from '@core/domain/value-objects/value-object.vo';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';

export class PaymentStatusVO extends ValueObject<PaymentStatus> {
  protected validate(input: PaymentStatus): void {
    const isValidStatus = Object.values(PaymentStatus).includes(input);

    if (!isValidStatus) {
      throw new DomainBusinessException('Invalid payment status');
    }
  }

  static create(status: PaymentStatus): PaymentStatusVO {
    return new PaymentStatusVO(status);
  }
}
