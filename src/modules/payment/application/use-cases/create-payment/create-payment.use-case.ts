export type CreatePaymentUseCaseInput = {
  readonly sessionId: string;
  readonly idempotencyKey: string;
};

export type CreatePaymentUseCaseOutput = {
  readonly image: string;
};

export interface CreatePaymentUseCase {
  execute(
    input: CreatePaymentUseCaseInput,
  ): Promise<CreatePaymentUseCaseOutput>;
}

export const CreatePaymentUseCase = Symbol('CreatePaymentUseCase');
