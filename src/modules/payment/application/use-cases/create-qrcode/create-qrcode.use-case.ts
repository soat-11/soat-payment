import { Result } from '@core/domain/result';

export interface CreateQRCodeImageInput {
  qrData: string;
}

export interface CreateQRCodeImageOutput {
  image: string;
}

export interface CreateQRCodeImage {
  execute(
    input: CreateQRCodeImageInput,
  ): Promise<Result<CreateQRCodeImageOutput>>;
}

export const CreateQRCodeImage = Symbol('CreateQRCodeImage');
