import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { SystemDateDomainService } from '@core/domain/service/system-date.service';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { CancelPaymentUseCaseImpl } from '@payment/application/use-cases/cancel-payment/cancel-payment-impl.use-case';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import {
  PaymentAlreadyCanceledException,
  PaymentNotFoundException,
} from '@payment/domain/exceptions/payment.exception';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
import { FakeLogger, FakePaymentRepository } from '@test/fakes';

describe('CancelPaymentUseCase - Unit Test', () => {
  let useCase: CancelPaymentUseCaseImpl;
  let paymentRepository: FakePaymentRepository;
  let logger: FakeLogger;
  let systemDate: SystemDateDomainService;

  const createPayment = () => {
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
          qrCode: 'qr-code-123',
        }),
      );
  };

  const createPaymentWithStatus = (status: PaymentStatus) => {
    const now = SystemDateImpl.nowUTC();
    return PaymentEntity.fromPersistence(UniqueEntityID.create(), {
      amount: 100,
      expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
      idempotencyKey: UniqueEntityID.create().value,
      sessionId: UniqueEntityID.create().value,
      type: PaymentType.PIX,
      status,
    }).addPaymentProvider({
      externalPaymentId: 'external-id-123',
      provider: PaymentProviders.MERCADO_PAGO,
    });
  };

  beforeEach(() => {
    paymentRepository = new FakePaymentRepository();
    systemDate = new SystemDateImpl();
    logger = new FakeLogger();
    useCase = new CancelPaymentUseCaseImpl(
      paymentRepository,
      logger,
      systemDate,
    );
  });

  describe('Success', () => {
    it('should cancel a PENDING payment', async () => {
      const payment = createPayment();
      await paymentRepository.save(payment);

      const result = await useCase.execute({
        paymentReference: payment.paymentProvider?.value
          .externalPaymentId as string,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.canceledAt).toBeInstanceOf(Date);
      expect(payment.status.value).toBe(PaymentStatus.CANCELED);
      expect(payment.canceledAt).toBeInstanceOf(Date);
      expect(paymentRepository.updatedPayment).toBe(payment);
    });

    it('should cancel a PAID payment', async () => {
      const payment = createPaymentWithStatus(PaymentStatus.PAID);
      await paymentRepository.save(payment);

      const result = await useCase.execute({
        paymentReference: payment.paymentProvider?.value
          .externalPaymentId as string,
      });

      expect(result.isSuccess).toBe(true);
      expect(payment.status.value).toBe(PaymentStatus.CANCELED);
      expect(payment.canceledAt).toBeInstanceOf(Date);
    });

    it('should cancel a REFUNDED payment', async () => {
      const payment = createPaymentWithStatus(PaymentStatus.REFUNDED);
      await paymentRepository.save(payment);

      const result = await useCase.execute({
        paymentReference: payment.paymentProvider?.value
          .externalPaymentId as string,
      });

      expect(result.isSuccess).toBe(true);
      expect(payment.status.value).toBe(PaymentStatus.CANCELED);
      expect(payment.canceledAt).toBeInstanceOf(Date);
    });

    it('should log the cancellation process', async () => {
      const payment = createPayment();
      await paymentRepository.save(payment);

      const result = await useCase.execute({
        paymentReference: payment.paymentProvider?.value
          .externalPaymentId as string,
      });

      expect(result.isSuccess).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'Cancelando pagamento',
        context: {
          paymentId: payment.paymentProvider?.value.externalPaymentId as string,
        },
      });
      expect(logger.logs).toContainEqual({
        message: 'Pagamento cancelado',
        context: {
          paymentReference: payment.paymentProvider?.value
            .externalPaymentId as string,
        },
      });
    });
  });

  describe('Error', () => {
    it('should return PaymentNotFoundException when payment does not exist', async () => {
      const nonExistentId = UniqueEntityID.create();

      const result = await useCase.execute({
        paymentReference: nonExistentId.value,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentNotFoundException);
      expect(paymentRepository.updatedPayment).toBeNull();
    });

    it('should log when payment is not found', async () => {
      const nonExistentId = UniqueEntityID.create();

      const result = await useCase.execute({
        paymentReference: nonExistentId.value,
      });

      expect(result.isFailure).toBe(true);
      expect(logger.logs).toContainEqual({
        message: 'Pagamento não encontrado',
        context: { paymentId: nonExistentId.value },
      });
    });

    it('should return PaymentAlreadyCanceledException when payment is already canceled', async () => {
      const payment = createPaymentWithStatus(PaymentStatus.CANCELED);
      await paymentRepository.save(payment);

      const result = await useCase.execute({
        paymentReference: payment.paymentProvider?.value
          .externalPaymentId as string,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentAlreadyCanceledException);
    });
  });
});
