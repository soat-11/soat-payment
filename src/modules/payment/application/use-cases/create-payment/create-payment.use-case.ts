export type CreatePaymentUseCaseInput = {
  readonly amount: number;
};

export type CreatePaymentUseCaseOutput = {
  readonly qrCode: string;
};

export interface CreatePaymentUseCase {
  execute(
    input: CreatePaymentUseCaseInput,
  ): Promise<CreatePaymentUseCaseOutput>;
}

export const CreatePaymentUseCase = Symbol('CreatePaymentUseCase');
