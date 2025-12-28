import { Result } from '@core/domain/result';

export type RefundPaymentUseCaseInput = {
  readonly paymentReference: string;
};

export type RefundPaymentUseCaseOutput = {
  readonly refundedAt: Date;
};

export interface RefundPaymentUseCase {
  execute(
    input: RefundPaymentUseCaseInput,
  ): Promise<Result<RefundPaymentUseCaseOutput>>;
}

export const RefundPaymentUseCase = Symbol('RefundPaymentUseCase');
