import { ValueObject } from '@core/domain/value-objects/value-object.vo';
import { PaymentProviders } from '../enum/payment-provider.enum';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';

export type PaymentProviderProps = {
  provider: PaymentProviders;
  externalPaymentId: string;
};

export class PaymentProvider extends ValueObject<PaymentProviderProps> {
  protected constructor(props: PaymentProviderProps) {
    super(props);
  }

  protected validate(input: PaymentProviderProps): void {
    const validProviders = Object.values(PaymentProviders);
    if (!validProviders.includes(input.provider)) {
      throw new DomainBusinessException(
        `Provedor de pagamento inválido: ${input}`,
      );
    }
  }

  static create(props: PaymentProviderProps): PaymentProvider {
    return new PaymentProvider(props);
  }
}
