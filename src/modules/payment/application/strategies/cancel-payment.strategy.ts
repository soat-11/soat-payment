import { Result } from '@core/domain/result';
import { CancelPaymentUseCase } from '@payment/application/use-cases/cancel-payment/cancel-payment.use-case';
import { PaymentProcessingStrategy } from './payment-processing.strategy';

export class CancelPaymentStrategy implements PaymentProcessingStrategy {
  constructor(private readonly cancelPaymentUseCase: CancelPaymentUseCase) {}

  async execute(paymentReference: string): Promise<Result<void>> {
    const result = await this.cancelPaymentUseCase.execute({
      paymentReference,
    });

    if (result.isFailure) {
      return Result.fail(result.error);
    }

    return Result.ok();
  }
}
