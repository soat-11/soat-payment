import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { ValueObject } from '@core/domain/value-objects/value-object.vo';

export class PaymentAmountVO extends ValueObject<number> {
  constructor(value: number) {
    super(value);
  }

  protected validate(value: number): void {
    if (value <= 0) {
      throw new DomainBusinessException(
        'Valor do pagamento deve ser maior que zero.',
      );
    }
  }

  static create(value: number): PaymentAmountVO {
    return new PaymentAmountVO(value);
  }
}
