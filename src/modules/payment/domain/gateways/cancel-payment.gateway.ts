import { Result } from '@core/domain/result';

export interface CancelPaymentGateway {
  cancelPayment(orderId: string): Promise<Result<void>>;
}

export const CancelPaymentGateway = Symbol.for('CancelPaymentGateway');
