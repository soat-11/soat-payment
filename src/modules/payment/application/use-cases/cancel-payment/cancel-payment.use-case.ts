import { DomainException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';

export type CancelPaymentUseCaseInput = {
  readonly paymentId: UniqueEntityID;
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
