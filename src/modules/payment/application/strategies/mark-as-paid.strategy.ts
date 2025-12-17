import { Result } from '@core/domain/result';
import { MarkAsPaidGateway } from '@payment/domain/gateways/mark-as-paid';
import { PaymentProcessingStrategy } from './payment-processing.strategy';

export class MarkAsPaidStrategy implements PaymentProcessingStrategy {
  constructor(private readonly markAsPaidGateway: MarkAsPaidGateway) {}

  async execute(paymentReference: string): Promise<Result<void>> {
    return this.markAsPaidGateway.markAsPaid(paymentReference);
  }
}
