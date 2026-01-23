import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { GetQRCodeBySessionIdUseCaseImpl } from '@payment/application/use-cases/get-qrcode-by-session-id/get-qrcode-by-session-id-impl.use-case';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import {
  PaymentNotFoundException,
  QRCodeDataInvalidException,
} from '@payment/domain/exceptions/payment.exception';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
import { SessionIdVO } from '@payment/domain/value-objects/session-id.vo';
import { FakeLogger, FakePaymentRepository } from '@test/fakes';

describe('GetQRCodeBySessionIdUseCase - Unit Test', () => {
  let useCase: GetQRCodeBySessionIdUseCaseImpl;
  let paymentRepository: FakePaymentRepository;
  let logger: FakeLogger;

  const validBase64QRCode =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const createPaymentWithQRCode = (qrCode: string, sessionId?: string) => {
    const now = SystemDateImpl.nowUTC();
    const session = sessionId ?? UniqueEntityID.create().value;
    return PaymentEntity.create({
      amount: 100,
      expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
      idempotencyKey: UniqueEntityID.create().value,
      sessionId: session,
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

  const createPaymentWithoutDetail = (sessionId?: string) => {
    const now = SystemDateImpl.nowUTC();
    const session = sessionId ?? UniqueEntityID.create().value;
    return PaymentEntity.create({
      amount: 100,
      expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
      idempotencyKey: UniqueEntityID.create().value,
      sessionId: session,
      type: PaymentType.PIX,
    }).addPaymentProvider({
      externalPaymentId: 'external-id-123',
      provider: PaymentProviders.MERCADO_PAGO,
    });
  };

  beforeEach(() => {
    paymentRepository = new FakePaymentRepository();
    logger = new FakeLogger();
    useCase = new GetQRCodeBySessionIdUseCaseImpl(paymentRepository, logger);
  });

  describe('Success', () => {
    it('should return QR Code buffer when payment exists with valid QR Code', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPaymentWithQRCode(validBase64QRCode, sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(Buffer);
      expect(result.value.length).toBeGreaterThan(0);
    });

    it('should log the QR Code retrieval process', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPaymentWithQRCode(validBase64QRCode, sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isSuccess).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'Get QR Code by Session ID',
        context: { sessionId },
      });
      expect(logger.logs).toContainEqual({
        message: 'QR Code buffer created',
        context: { bufferLength: expect.any(Number) },
      });
    });

    it('should correctly decode base64 image to buffer', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPaymentWithQRCode(validBase64QRCode, sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

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
      const nonExistentSessionId = UniqueEntityID.create().value;

      const result = await useCase.execute(
        SessionIdVO.create(nonExistentSessionId),
      );

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentNotFoundException);
    });

    it('should log when payment is not found', async () => {
      const nonExistentSessionId = UniqueEntityID.create().value;

      const result = await useCase.execute(
        SessionIdVO.create(nonExistentSessionId),
      );

      expect(result.isFailure).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'Payment not found',
        context: { sessionId: nonExistentSessionId },
      });
    });

    it('should return QRCodeDataInvalidException when payment has no detail', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPaymentWithoutDetail(sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(QRCodeDataInvalidException);
    });

    it('should log when QR Code data is invalid', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPaymentWithoutDetail(sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isFailure).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'QR Code data invalid',
        context: { sessionId },
      });
    });

    it('should return QRCodeDataInvalidException when QR Code is not a valid base64 image', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPaymentWithQRCode('invalid-qr-code-data', sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(QRCodeDataInvalidException);
    });

    it('should log when QR Code is not a valid base64 image', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPaymentWithQRCode('invalid-qr-code-data', sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isFailure).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'QR Code data is not a valid base64 image',
        context: { sessionId },
      });
    });
  });
});
