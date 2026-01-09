import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { GetQRCodeByIdempotencyKeyUseCaseImpl } from '@payment/application/use-cases/get-qrcode-by-idempotency-key/get-qrcode-by-idempotency-key-impl.use-case';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import {
  PaymentNotFoundException,
  QRCodeDataInvalidException,
} from '@payment/domain/exceptions/payment.exception';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
import { FakeLogger, FakePaymentRepository } from '@test/fakes';

describe('GetQRCodeByIdempotencyKeyUseCase - Unit Test', () => {
  let useCase: GetQRCodeByIdempotencyKeyUseCaseImpl;
  let paymentRepository: FakePaymentRepository;
  let logger: FakeLogger;

  const validBase64QRCode =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const createPaymentWithQRCode = (qrCode: string, idempotencyKey?: string) => {
    const now = SystemDateImpl.nowUTC();
    const key = idempotencyKey ?? UniqueEntityID.create().value;
    return PaymentEntity.create({
      amount: 100,
      expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
      idempotencyKey: key,
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

  const createPaymentWithoutDetail = (idempotencyKey?: string) => {
    const now = SystemDateImpl.nowUTC();
    const key = idempotencyKey ?? UniqueEntityID.create().value;
    return PaymentEntity.create({
      amount: 100,
      expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
      idempotencyKey: key,
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
    useCase = new GetQRCodeByIdempotencyKeyUseCaseImpl(
      paymentRepository,
      logger,
    );
  });

  describe('Success', () => {
    it('should return QR Code buffer when payment exists with valid QR Code', async () => {
      const idempotencyKey = UniqueEntityID.create().value;
      const payment = createPaymentWithQRCode(
        validBase64QRCode,
        idempotencyKey,
      );
      await paymentRepository.save(payment);

      const result = await useCase.execute(
        IdempotencyKeyVO.create(idempotencyKey),
      );

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Buffer);
      expect(result.value.length).toBeGreaterThan(0);
    });

    it('should log the QR Code retrieval process', async () => {
      const idempotencyKey = UniqueEntityID.create().value;
      const payment = createPaymentWithQRCode(
        validBase64QRCode,
        idempotencyKey,
      );
      await paymentRepository.save(payment);

      const result = await useCase.execute(
        IdempotencyKeyVO.create(idempotencyKey),
      );

      expect(result.isSuccess).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'Get QR Code by Idempotency Key',
        context: { idempotencyKey },
      });
      expect(logger.logs).toContainEqual({
        message: 'QR Code buffer created',
        context: { bufferLength: expect.any(Number) },
      });
    });

    it('should correctly decode base64 image to buffer', async () => {
      const idempotencyKey = UniqueEntityID.create().value;
      const payment = createPaymentWithQRCode(
        validBase64QRCode,
        idempotencyKey,
      );
      await paymentRepository.save(payment);

      const result = await useCase.execute(
        IdempotencyKeyVO.create(idempotencyKey),
      );

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
      const nonExistentKey = UniqueEntityID.create().value;

      const result = await useCase.execute(
        IdempotencyKeyVO.create(nonExistentKey),
      );

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentNotFoundException);
    });

    it('should log when payment is not found', async () => {
      const nonExistentKey = UniqueEntityID.create().value;

      const result = await useCase.execute(
        IdempotencyKeyVO.create(nonExistentKey),
      );

      expect(result.isFailure).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'Payment not found',
        context: { idempotencyKey: nonExistentKey },
      });
    });

    it('should return QRCodeDataInvalidException when payment has no detail', async () => {
      const idempotencyKey = UniqueEntityID.create().value;
      const payment = createPaymentWithoutDetail(idempotencyKey);
      await paymentRepository.save(payment);

      const result = await useCase.execute(
        IdempotencyKeyVO.create(idempotencyKey),
      );

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(QRCodeDataInvalidException);
    });

    it('should log when QR Code data is invalid', async () => {
      const idempotencyKey = UniqueEntityID.create().value;
      const payment = createPaymentWithoutDetail(idempotencyKey);
      await paymentRepository.save(payment);

      const result = await useCase.execute(
        IdempotencyKeyVO.create(idempotencyKey),
      );

      expect(result.isFailure).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'QR Code data invalid',
        context: { idempotencyKey },
      });
    });

    it('should return QRCodeDataInvalidException when QR Code is not a valid base64 image', async () => {
      const idempotencyKey = UniqueEntityID.create().value;
      const payment = createPaymentWithQRCode(
        'invalid-qr-code-data',
        idempotencyKey,
      );
      await paymentRepository.save(payment);

      const result = await useCase.execute(
        IdempotencyKeyVO.create(idempotencyKey),
      );

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(QRCodeDataInvalidException);
    });

    it('should log when QR Code is not a valid base64 image', async () => {
      const idempotencyKey = UniqueEntityID.create().value;
      const payment = createPaymentWithQRCode(
        'invalid-qr-code-data',
        idempotencyKey,
      );
      await paymentRepository.save(payment);

      const result = await useCase.execute(
        IdempotencyKeyVO.create(idempotencyKey),
      );

      expect(result.isFailure).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'QR Code data is not a valid base64 image',
        context: { idempotencyKey },
      });
    });
  });
});
