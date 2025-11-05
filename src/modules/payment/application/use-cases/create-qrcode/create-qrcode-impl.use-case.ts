import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import {
  CreateQRCodeImage,
  CreateQRCodeImageInput,
  CreateQRCodeImageOutput,
} from '@payment/application/use-cases/create-qrcode/create-qrcode.use-case';
import { toDataURL } from 'qrcode';

export class CreateQRCodeImageUseCaseImpl implements CreateQRCodeImage {
  async execute(
    data: CreateQRCodeImageInput,
  ): Promise<Result<CreateQRCodeImageOutput>> {
    try {
      const image = await toDataURL(data.qrData, { type: 'image/png' });
      return Result.ok({
        image,
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      return Result.fail(
        new DomainBusinessException('Erro ao gerar imagem do QR Code'),
      );
    }
  }
}
