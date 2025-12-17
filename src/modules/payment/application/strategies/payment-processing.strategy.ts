import { Result } from '@core/domain/result';

export interface PaymentProcessingStrategy {
  execute(paymentReference: string): Promise<Result<void>>;
}

export const PaymentProcessingStrategy = Symbol.for(
  'PaymentProcessingStrategy',
);
