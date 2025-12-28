import { ValueObject } from '@core/domain/value-objects/value-object.vo';
import {
  PaymentExternalPaymentIdRequiredException,
  PaymentProviderInvalidException,
} from '@payment/domain/exceptions/payment.exception';

import { PaymentProviders } from '@/modules/payment/domain/enum/payment-provider.enum';


export type PaymentProviderProps = {
  provider: PaymentProviders;
  externalPaymentId: string;
};

export class PaymentProvider extends ValueObject<PaymentProviderProps> {
  protected constructor(props: PaymentProviderProps) {
    super(props);
  }

  static create(props: PaymentProviderProps): PaymentProvider {
    return new PaymentProvider(props);
  }

  protected validate(input: PaymentProviderProps): void {
    const validProviders = Object.values(PaymentProviders);
    if (!validProviders.includes(input.provider)) {
      throw new PaymentProviderInvalidException(input.provider);
    }

    if (!input.externalPaymentId || input.externalPaymentId.trim() === '') {
      throw new PaymentExternalPaymentIdRequiredException(
        input.externalPaymentId,
      );
    }
  }
}
