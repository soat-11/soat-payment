import { DomainException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';

export type CancelPaymentUseCaseInput = {
  readonly paymentReference: string;
};

export type CancelPaymentUseCaseOutput = {
  readonly canceledAt: Date;
};

export type CancelPaymentUseCaseError = DomainException;

export interface CancelPaymentUseCase {
  execute(
    input: CancelPaymentUseCaseInput,
  ): Promise<Result<CancelPaymentUseCaseOutput, CancelPaymentUseCaseError>>;
}

export const CancelPaymentUseCase = Symbol('CancelPaymentUseCase');
