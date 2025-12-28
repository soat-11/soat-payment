import { Result } from '@core/domain/result';
import { RefundPaymentUseCase } from '@payment/application/use-cases/refund-payment/refund-payment.use-case';

import { PaymentProcessingStrategy } from './payment-processing.strategy';

export class RefundPaymentStrategy implements PaymentProcessingStrategy {
  constructor(private readonly refundPaymentUseCase: RefundPaymentUseCase) {}

  async execute(paymentReference: string): Promise<Result<void>> {
    const result = await this.refundPaymentUseCase.execute({
      paymentReference,
    });

    if (result.isFailure) {
      return Result.fail(result.error);
    }

    return Result.ok();
  }
}
