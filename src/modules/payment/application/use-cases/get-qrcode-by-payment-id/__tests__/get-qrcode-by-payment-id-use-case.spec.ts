import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { GetQRCodeByPaymentIdUseCaseImpl } from '@payment/application/use-cases/get-qrcode-by-payment-id/get-qrcode-by-payment-id-impl.use-case';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import {
  PaymentNotFoundException,
  QRCodeDataInvalidException,
} from '@payment/domain/exceptions/payment.exception';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
import { FakeLogger, FakePaymentRepository } from '@test/fakes';

describe('GetQRCodeByPaymentIdUseCase - Unit Test', () => {
  let useCase: GetQRCodeByPaymentIdUseCaseImpl;
  let paymentRepository: FakePaymentRepository;
  let logger: FakeLogger;

  const validBase64QRCode =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const createPaymentWithQRCode = (qrCode: string) => {
    const now = SystemDateImpl.nowUTC();
    return PaymentEntity.create({
      amount: 100,
      expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
      idempotencyKey: UniqueEntityID.create().value,
      sessionId: UniqueEntityID.create().value,
      type: PaymentType.PIX,
    })
      .addPaymentProvider({
        externalPaymentId: 'external-id-123',
        provider: PaymentProviders.MERCADO_PAGO,
      })
      .addPaymentDetail(
        PixDetailVO.create({
          qrCode,
        }),
      );
  };

  const createPaymentWithoutDetail = () => {
    const now = SystemDateImpl.nowUTC();
    return PaymentEntity.create({
      amount: 100,
      expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
      idempotencyKey: UniqueEntityID.create().value,
      sessionId: UniqueEntityID.create().value,
      type: PaymentType.PIX,
    }).addPaymentProvider({
      externalPaymentId: 'external-id-123',
      provider: PaymentProviders.MERCADO_PAGO,
    });
  };

  beforeEach(() => {
    paymentRepository = new FakePaymentRepository();
    logger = new FakeLogger();
    useCase = new GetQRCodeByPaymentIdUseCaseImpl(paymentRepository, logger);
  });

  describe('Success', () => {
    it('should return QR Code buffer when payment exists with valid QR Code', async () => {
      const payment = createPaymentWithQRCode(validBase64QRCode);
      await paymentRepository.save(payment);

      const result = await useCase.execute(payment.id);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Buffer);
      expect(result.value.length).toBeGreaterThan(0);
    });

    it('should log the QR Code retrieval process', async () => {
      const payment = createPaymentWithQRCode(validBase64QRCode);
      await paymentRepository.save(payment);

      const result = await useCase.execute(payment.id);

      expect(result.isSuccess).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'Get QR Code by Payment ID',
        context: { paymentId: payment.id.value },
      });
      expect(logger.logs).toContainEqual({
        message: 'QR Code buffer created',
        context: { bufferLength: expect.any(Number) },
      });
    });

    it('should correctly decode base64 image to buffer', async () => {
      const payment = createPaymentWithQRCode(validBase64QRCode);
      await paymentRepository.save(payment);

      const result = await useCase.execute(payment.id);

      expect(result.isSuccess).toBe(true);

      const expectedBuffer = Buffer.from(
        validBase64QRCode.replace(/^data:image\/png;base64,/, ''),
        'base64',
      );
      expect(result.value).toEqual(expectedBuffer);
    });
  });

  describe('Error', () => {
    it('should return PaymentNotFoundException when payment does not exist', async () => {
      const nonExistentId = UniqueEntityID.create();

      const result = await useCase.execute(nonExistentId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentNotFoundException);
    });

    it('should log when payment is not found', async () => {
      const nonExistentId = UniqueEntityID.create();

      const result = await useCase.execute(nonExistentId);

      expect(result.isFailure).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'Payment not found',
        context: { paymentId: nonExistentId.value },
      });
    });

    it('should return QRCodeDataInvalidException when payment has no detail', async () => {
      const payment = createPaymentWithoutDetail();
      await paymentRepository.save(payment);

      const result = await useCase.execute(payment.id);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(QRCodeDataInvalidException);
    });

    it('should log when QR Code data is invalid', async () => {
      const payment = createPaymentWithoutDetail();
      await paymentRepository.save(payment);

      const result = await useCase.execute(payment.id);

      expect(result.isFailure).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'QR Code data invalid',
        context: { paymentId: payment.id.value },
      });
    });

    it('should return QRCodeDataInvalidException when QR Code is not a valid base64 image', async () => {
      const payment = createPaymentWithQRCode('invalid-qr-code-data');
      await paymentRepository.save(payment);

      const result = await useCase.execute(payment.id);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(QRCodeDataInvalidException);
    });

    it('should log when QR Code is not a valid base64 image', async () => {
      const payment = createPaymentWithQRCode('invalid-qr-code-data');
      await paymentRepository.save(payment);

      const result = await useCase.execute(payment.id);

      expect(result.isFailure).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'QR Code data is not a valid base64 image',
        context: { paymentId: payment.id.value },
      });
    });
  });
});
