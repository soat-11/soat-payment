import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { GetPaymentDetailsBySessionIdUseCaseImpl } from '@payment/application/use-cases/get-payment-details-by-session-id/get-payment-details-by-session-id-impl.use-case';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentNotFoundException } from '@payment/domain/exceptions/payment.exception';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
import { SessionIdVO } from '@payment/domain/value-objects/session-id.vo';
import { FakeLogger, FakePaymentRepository } from '@test/fakes';

describe('GetPaymentDetailsBySessionIdUseCase - Unit Test', () => {
  let useCase: GetPaymentDetailsBySessionIdUseCaseImpl;
  let paymentRepository: FakePaymentRepository;
  let logger: FakeLogger;

  const createPayment = (sessionId?: string) => {
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
          qrCode: 'qr-code-123',
        }),
      );
  };

  beforeEach(() => {
    paymentRepository = new FakePaymentRepository();
    logger = new FakeLogger();
    useCase = new GetPaymentDetailsBySessionIdUseCaseImpl(
      paymentRepository,
      logger,
    );
  });

  describe('Success', () => {
    it('should return payment details when payment exists', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPayment(sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        id: payment.id.value,
        status: PaymentStatus.PENDING,
        amount: 100,
        type: PaymentType.PIX,
        expiresAt: payment.expiresAt,
        externalPaymentId: 'external-id-123',
      });
    });

    it('should log the payment details retrieval process', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPayment(sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isSuccess).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'Get Payment Details by Session ID',
        context: { sessionId },
      });
      expect(logger.logs).toContainEqual({
        message: 'Payment found',
        context: { paymentId: payment.id.value, sessionId },
      });
    });

    it('should return correct amount value', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPayment(sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isSuccess).toBe(true);
      expect(result.value.amount).toBe(100);
    });

    it('should return correct payment type', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPayment(sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isSuccess).toBe(true);
      expect(result.value.type).toBe(PaymentType.PIX);
    });

    it('should return correct status', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPayment(sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(PaymentStatus.PENDING);
    });

    it('should return externalPaymentId from payment provider', async () => {
      const sessionId = UniqueEntityID.create().value;
      const payment = createPayment(sessionId);
      await paymentRepository.save(payment);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isSuccess).toBe(true);
      expect(result.value.externalPaymentId).toBe('external-id-123');
    });

    it('should return null externalPaymentId when payment has no provider', async () => {
      const sessionId = UniqueEntityID.create().value;
      const now = SystemDateImpl.nowUTC();
      const paymentWithoutProvider = PaymentEntity.create({
        amount: 100,
        expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
        idempotencyKey: UniqueEntityID.create().value,
        sessionId: sessionId,
        type: PaymentType.PIX,
      }).addPaymentDetail(
        PixDetailVO.create({
          qrCode: 'qr-code-123',
        }),
      );
      await paymentRepository.save(paymentWithoutProvider);

      const result = await useCase.execute(SessionIdVO.create(sessionId));

      expect(result.isSuccess).toBe(true);
      expect(result.value.externalPaymentId).toBeNull();
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
  });
});
