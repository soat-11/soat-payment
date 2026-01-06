import { Result } from '@core/domain/result';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { GetQRCodeByIdempotencyKeyUseCase } from '@payment/application/use-cases/get-qrcode-by-idempotency-key/get-qrcode-by-idempotency-key.use-case';
import {
  PaymentNotFoundException,
  QRCodeDataInvalidException,
} from '@payment/domain/exceptions/payment.exception';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';

export class GetQRCodeByIdempotencyKeyUseCaseImpl
  implements GetQRCodeByIdempotencyKeyUseCase
{
  constructor(
    private readonly paymentRepository: Pick<
      PaymentRepository,
      'findByIdempotencyKey'
    >,
    private readonly logger: AbstractLoggerService,
  ) {}

  async execute(idempotencyKey: IdempotencyKeyVO): Promise<Result<Buffer>> {
    this.logger.log('Get QR Code by Idempotency Key', {
      idempotencyKey: idempotencyKey.value,
    });

    const payment =
      await this.paymentRepository.findByIdempotencyKey(idempotencyKey);
    if (!payment) {
      this.logger.log('Payment not found', {
        idempotencyKey: idempotencyKey.value,
      });
      return Result.fail(new PaymentNotFoundException(idempotencyKey.value));
    }

    const qrCodeData = payment.detail?.qrCode;
    this.logger.log('QR Code data', {
      qrCodeData: qrCodeData,
    });

    if (!qrCodeData) {
      this.logger.log('QR Code data invalid', {
        idempotencyKey: idempotencyKey.value,
      });
      return Result.fail(new QRCodeDataInvalidException());
    }

    const base64Pattern = /^data:image\/png;base64,/;

    const isValid = base64Pattern.test(qrCodeData);
    if (!isValid) {
      this.logger.log('QR Code data is not a valid base64 image', {
        idempotencyKey: idempotencyKey.value,
      });
      return Result.fail(new QRCodeDataInvalidException());
    }

    const buffer = Buffer.from(qrCodeData.replace(base64Pattern, ''), 'base64');

    this.logger.log('QR Code buffer created', {
      bufferLength: buffer.length,
    });

    return Result.ok(buffer);
  }
}
