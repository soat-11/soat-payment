import { Result } from '@core/domain/result';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { GetQRCodeBySessionIdUseCase } from '@payment/application/use-cases/get-qrcode-by-session-id/get-qrcode-by-session-id.use-case';
import {
  PaymentNotFoundException,
  QRCodeDataInvalidException,
} from '@payment/domain/exceptions/payment.exception';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { SessionIdVO } from '@payment/domain/value-objects/session-id.vo';

export class GetQRCodeBySessionIdUseCaseImpl
  implements GetQRCodeBySessionIdUseCase
{
  constructor(
    private readonly paymentRepository: Pick<
      PaymentRepository,
      'findBySessionId'
    >,
    private readonly logger: AbstractLoggerService,
  ) {}

  async execute(sessionId: SessionIdVO): Promise<Result<Buffer>> {
    this.logger.log('Get QR Code by Session ID', {
      sessionId: sessionId.value,
    });

    const payment = await this.paymentRepository.findBySessionId(sessionId);
    if (!payment) {
      this.logger.log('Payment not found', {
        sessionId: sessionId.value,
      });
      return Result.fail(new PaymentNotFoundException(sessionId.value));
    }

    const qrCodeData = payment.detail?.qrCode;
    this.logger.log('QR Code data', {
      qrCodeData: qrCodeData,
    });

    if (!qrCodeData) {
      this.logger.log('QR Code data invalid', {
        sessionId: sessionId.value,
      });
      return Result.fail(new QRCodeDataInvalidException());
    }

    const base64Pattern = /^data:image\/png;base64,/;

    const isValid = base64Pattern.test(qrCodeData);
    if (!isValid) {
      this.logger.log('QR Code data is not a valid base64 image', {
        sessionId: sessionId.value,
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
