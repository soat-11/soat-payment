import { Result } from '@core/domain/result';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';

export type PaymentProcessorUseCaseInput = {
  readonly paymentReference: string;
  readonly status: PaymentStatus;
};

export type PaymentProcessorUseCaseOutput = void;

export interface PaymentProcessorUseCase {
  execute(
    input: PaymentProcessorUseCaseInput,
  ): Promise<Result<PaymentProcessorUseCaseOutput>>;
}

export const PaymentProcessorUseCase = Symbol('PaymentProcessorUseCase');
