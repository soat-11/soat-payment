import { DomainException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';

export type CreatePaymentUseCaseInput = {
  readonly sessionId: string;
  readonly idempotencyKey: string;
};

export type CreatePaymentUseCaseOutput = {
  readonly image: string;
  readonly paymentId: string;
};

export type CreatePaymentUseCaseError = DomainException;

export interface CreatePaymentUseCase {
  execute(
    input: CreatePaymentUseCaseInput,
  ): Promise<Result<CreatePaymentUseCaseOutput, CreatePaymentUseCaseError>>;
}

export const CreatePaymentUseCase = Symbol('CreatePaymentUseCase');
