import { Result } from '@core/domain/result';

export interface MarkAsPaidGateway {
  markAsPaid(paymentReference: string): Promise<Result<void>>;
}

export const MarkAsPaidGateway = Symbol.for('MarkAsPaidGateway');
