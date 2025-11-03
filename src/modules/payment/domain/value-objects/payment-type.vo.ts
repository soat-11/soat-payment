import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { ValueObject } from '@core/domain/value-objects/value-object.vo';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';

export class PaymentTypeVO extends ValueObject<PaymentType> {
  protected validate(input: PaymentType): void {
    const isValid = Object.values(PaymentType).includes(input);
    if (!isValid) {
      throw new DomainBusinessException(`Tipo de pagamento inválido: ${input}`);
    }
  }

  static create(type: PaymentType): PaymentTypeVO {
    return new PaymentTypeVO(type);
  }
}
