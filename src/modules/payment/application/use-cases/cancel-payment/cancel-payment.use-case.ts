import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';

export type CancelPaymentUseCaseInput = {
  readonly paymentId: UniqueEntityID;
};

export type CancelPaymentUseCaseOutput = void;

export interface CancelPaymentUseCase {
  execute(
    input: CancelPaymentUseCaseInput,
  ): Promise<CancelPaymentUseCaseOutput>;
}

export const CancelPaymentUseCase = Symbol('CancelPaymentUseCase');
