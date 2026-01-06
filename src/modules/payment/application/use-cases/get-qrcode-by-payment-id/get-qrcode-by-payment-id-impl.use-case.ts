import { Result } from '@core/domain/result';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { GetQRCodeByPaymentIdUseCase } from '@payment/application/use-cases/get-qrcode-by-payment-id/get-qrcode-by-payment-id.use-case';
import {
  PaymentNotFoundException,
  QRCodeDataInvalidException,
} from '@payment/domain/exceptions/payment.exception';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';

export class GetQRCodeByPaymentIdUseCaseImpl
  implements GetQRCodeByPaymentIdUseCase
{
  constructor(
    private readonly paymentRepository: Pick<PaymentRepository, 'findById'>,
    private readonly logger: AbstractLoggerService,
  ) {}

  async execute(paymentId: UniqueEntityID): Promise<Result<Buffer>> {
    this.logger.log('Get QR Code by Payment ID', {
      paymentId: paymentId.value,
    });

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.log('Payment not found', {
        paymentId: paymentId.value,
      });
      return Result.fail(new PaymentNotFoundException(paymentId.value));
    }

    const qrCodeData = payment.detail?.qrCode;
    this.logger.log('QR Code data', {
      qrCodeData: qrCodeData,
    });

    if (!qrCodeData) {
      this.logger.log('QR Code data invalid', {
        paymentId: paymentId.value,
      });
      return Result.fail(new QRCodeDataInvalidException());
    }

    const base64Pattern = /^data:image\/png;base64,/;

    const isValid = base64Pattern.test(qrCodeData);
    if (!isValid) {
      this.logger.log('QR Code data is not a valid base64 image', {
        paymentId: paymentId.value,
      });
      return Result.fail(new QRCodeDataInvalidException());
    }

    const buffer = Buffer.from(
      qrCodeData.replace(base64Pattern, ''),
      'base64',
    );

    this.logger.log('QR Code buffer created', {
      bufferLength: buffer.length,
    });

    return Result.ok(buffer);
  }
}
