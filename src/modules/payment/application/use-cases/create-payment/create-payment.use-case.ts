export type CreatePaymentUseCaseInput = {
  readonly amount: number;
  readonly qrCode: string;
};

export type CreatePaymentUseCaseOutput = void;

export interface CreatePaymentUseCase {
  execute(
    input: CreatePaymentUseCaseInput,
  ): Promise<CreatePaymentUseCaseOutput>;
}
