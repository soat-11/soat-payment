import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { SystemDateDomainService } from '@core/domain/service/system-date.service';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { RefundPaymentUseCaseImpl } from '@payment/application/use-cases/refund-payment/refund-payment-impl.use-case';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import {
  PaymentAlreadyRefundedException,
  PaymentNotFoundException,
} from '@payment/domain/exceptions/payment.exception';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
import { FakeLogger, FakePaymentRepository } from '@test/fakes';

describe('RefundPaymentUseCase - Unit Test', () => {
  let useCase: RefundPaymentUseCaseImpl;
  let paymentRepository: FakePaymentRepository;
  let logger: FakeLogger;
  let systemDate: SystemDateDomainService;

  const createPaymentWithStatus = (status: PaymentStatus) => {
    const now = SystemDateImpl.nowUTC();
    return PaymentEntity.fromPersistence(UniqueEntityID.create(), {
      amount: 100,
      expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
      idempotencyKey: UniqueEntityID.create().value,
      sessionId: UniqueEntityID.create().value,
      type: PaymentType.PIX,
      status,
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
    systemDate = new SystemDateImpl();
    logger = new FakeLogger();
    useCase = new RefundPaymentUseCaseImpl(
      paymentRepository,
      logger,
      systemDate,
    );
  });

  describe('Success', () => {
    it('should refund a PAID payment', async () => {
      const payment = createPaymentWithStatus(PaymentStatus.PAID);
      await paymentRepository.save(payment);
      const paymentReference = payment.paymentProvider!.value.externalPaymentId;

      const result = await useCase.execute({ paymentReference });

      expect(result.isSuccess).toBe(true);
      expect(result.value.refundedAt).toBeInstanceOf(Date);
      expect(payment.status.value).toBe(PaymentStatus.REFUNDED);
      expect(payment.refundedAt).toBeInstanceOf(Date);
      expect(paymentRepository.updatedPayment).toBe(payment);
    });

    it('should log the refund process', async () => {
      const payment = createPaymentWithStatus(PaymentStatus.PAID);
      await paymentRepository.save(payment);
      const paymentReference = payment.paymentProvider!.value.externalPaymentId;

      await useCase.execute({ paymentReference });

      expect(logger.logs).toContainEqual({
        message: 'Reembolsando pagamento',
        context: { paymentReference },
      });
      expect(logger.logs).toContainEqual({
        message: 'Pagamento reembolsado',
        context: { paymentReference },
      });
    });
  });

  describe('Error', () => {
    it('should return PaymentNotFoundException when payment does not exist', async () => {
      const nonExistentReference = 'non-existent-reference';

      const result = await useCase.execute({
        paymentReference: nonExistentReference,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentNotFoundException);
      expect(paymentRepository.updatedPayment).toBeNull();
    });

    it('should log when payment is not found', async () => {
      const nonExistentReference = 'non-existent-reference';

      await useCase.execute({ paymentReference: nonExistentReference });

      expect(logger.logs).toContainEqual({
        message: 'Pagamento não encontrado',
        context: { paymentReference: nonExistentReference },
      });
    });

    it('should return PaymentAlreadyRefundedException when payment is already refunded', async () => {
      const payment = createPaymentWithStatus(PaymentStatus.REFUNDED);
      await paymentRepository.save(payment);
      const paymentReference = payment.paymentProvider!.value.externalPaymentId;

      const result = await useCase.execute({ paymentReference });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentAlreadyRefundedException);
    });

    it('should log error when refund fails', async () => {
      const payment = createPaymentWithStatus(PaymentStatus.REFUNDED);
      await paymentRepository.save(payment);
      const paymentReference = payment.paymentProvider!.value.externalPaymentId;

      await useCase.execute({ paymentReference });

      expect(
        logger.logs.some(
          (log) => log.message === 'Erro ao reembolsar pagamento',
        ),
      ).toBe(true);
    });
  });
});
