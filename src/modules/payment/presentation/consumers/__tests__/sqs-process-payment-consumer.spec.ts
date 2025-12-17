import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { PaymentProcessorUseCase } from '@payment/application/use-cases/payment-processor/payment-processor.use-case';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import type { MercadoPagoProcessPaymentQueueMessage } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/mercado-pago-mark-as-paid-queue.dto';
import { MercadoPagoOrderAction } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';
import { MercadoPagoProcessPaymentConsumer } from '@payment/presentation/consumers/sqs-process-payment-consumer';
import { FakeLogger } from '@test/fakes';

describe('MercadoPagoProcessPaymentConsumer - Unit Test', () => {
  let consumer: MercadoPagoProcessPaymentConsumer;
  let mockPaymentProcessorUseCase: jest.Mocked<PaymentProcessorUseCase>;
  let logger: FakeLogger;

  const PAYMENT_REFERENCE = 'ORD01J49MMW3SSBK5PSV3DFR32959';

  beforeEach(() => {
    process.env.AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL =
      'http://localhost:4566/queue/process-payment';

    mockPaymentProcessorUseCase = {
      execute: jest.fn(),
    };
    logger = new FakeLogger();
    consumer = new MercadoPagoProcessPaymentConsumer(
      logger,
      mockPaymentProcessorUseCase,
    );
  });

  afterEach(() => {
    delete process.env.AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL;
  });

  describe('handleMessage', () => {
    describe('Success - Action Mapping', () => {
      it('should map order.processed to PAID status', async () => {
        const payload: MercadoPagoProcessPaymentQueueMessage = {
          paymentReference: PAYMENT_REFERENCE,
          webhookPayload: {
            action: MercadoPagoOrderAction.PROCESSED,
          },
        };
        mockPaymentProcessorUseCase.execute.mockResolvedValue(Result.ok());

        await consumer.handleMessage(payload);

        expect(mockPaymentProcessorUseCase.execute).toHaveBeenCalledWith({
          paymentReference: PAYMENT_REFERENCE,
          status: PaymentStatus.PAID,
        });
      });

      it('should map order.refunded to REFUNDED status', async () => {
        const payload: MercadoPagoProcessPaymentQueueMessage = {
          paymentReference: PAYMENT_REFERENCE,
          webhookPayload: {
            action: MercadoPagoOrderAction.REFUNDED,
          },
        };
        mockPaymentProcessorUseCase.execute.mockResolvedValue(Result.ok());

        await consumer.handleMessage(payload);

        expect(mockPaymentProcessorUseCase.execute).toHaveBeenCalledWith({
          paymentReference: PAYMENT_REFERENCE,
          status: PaymentStatus.REFUNDED,
        });
      });

      it('should map order.canceled to CANCELED status', async () => {
        const payload: MercadoPagoProcessPaymentQueueMessage = {
          paymentReference: PAYMENT_REFERENCE,
          webhookPayload: {
            action: MercadoPagoOrderAction.CANCELED,
          },
        };
        mockPaymentProcessorUseCase.execute.mockResolvedValue(Result.ok());

        await consumer.handleMessage(payload);

        expect(mockPaymentProcessorUseCase.execute).toHaveBeenCalledWith({
          paymentReference: PAYMENT_REFERENCE,
          status: PaymentStatus.CANCELED,
        });
      });

      it('should log processing message', async () => {
        const payload: MercadoPagoProcessPaymentQueueMessage = {
          paymentReference: PAYMENT_REFERENCE,
          webhookPayload: {
            action: MercadoPagoOrderAction.PROCESSED,
          },
        };
        mockPaymentProcessorUseCase.execute.mockResolvedValue(Result.ok());

        await consumer.handleMessage(payload);

        expect(logger.logs).toContainEqual({
          message: 'Processing Mercado Pago payment message',
          context: {
            paymentReference: PAYMENT_REFERENCE,
            action: MercadoPagoOrderAction.PROCESSED,
            payload: JSON.stringify(payload),
          },
        });
      });
    });

    describe('Validation - Missing Fields', () => {
      it('should ignore message without paymentReference', async () => {
        const payload: MercadoPagoProcessPaymentQueueMessage = {
          paymentReference: '',
          webhookPayload: {
            action: MercadoPagoOrderAction.PROCESSED,
          },
        };

        await consumer.handleMessage(payload);

        expect(mockPaymentProcessorUseCase.execute).not.toHaveBeenCalled();
        expect(logger.warnings).toContainEqual({
          message: 'Ignoring message without paymentReference',
          context: { payload },
        });
      });

      it('should ignore message without action', async () => {
        const payload: MercadoPagoProcessPaymentQueueMessage = {
          paymentReference: PAYMENT_REFERENCE,
          webhookPayload: {},
        };

        await consumer.handleMessage(payload);

        expect(mockPaymentProcessorUseCase.execute).not.toHaveBeenCalled();
        expect(logger.warnings).toContainEqual({
          message: 'Ignoring message without action',
          context: { payload },
        });
      });

      it('should ignore message with undefined webhookPayload', async () => {
        const payload = {
          paymentReference: PAYMENT_REFERENCE,
        } as MercadoPagoProcessPaymentQueueMessage;

        await consumer.handleMessage(payload);

        expect(mockPaymentProcessorUseCase.execute).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should catch DomainBusinessException and not throw', async () => {
        const payload: MercadoPagoProcessPaymentQueueMessage = {
          paymentReference: PAYMENT_REFERENCE,
          webhookPayload: {
            action: MercadoPagoOrderAction.PROCESSED,
          },
        };
        const error = new DomainBusinessException('Payment not found');
        mockPaymentProcessorUseCase.execute.mockRejectedValue(error);

        await expect(consumer.handleMessage(payload)).resolves.toBeUndefined();
      });

      it('should log warning when DomainBusinessException occurs', async () => {
        const payload: MercadoPagoProcessPaymentQueueMessage = {
          paymentReference: PAYMENT_REFERENCE,
          webhookPayload: {
            action: MercadoPagoOrderAction.PROCESSED,
          },
        };
        const error = new DomainBusinessException('Payment not found');
        mockPaymentProcessorUseCase.execute.mockRejectedValue(error);

        await consumer.handleMessage(payload);

        expect(logger.warnings).toContainEqual({
          message: 'Failed to process payment',
          context: { error: 'Payment not found', payload },
        });
      });

      it('should re-throw non-DomainBusinessException errors', async () => {
        const payload: MercadoPagoProcessPaymentQueueMessage = {
          paymentReference: PAYMENT_REFERENCE,
          webhookPayload: {
            action: MercadoPagoOrderAction.PROCESSED,
          },
        };
        const error = new Error('Database connection failed');
        mockPaymentProcessorUseCase.execute.mockRejectedValue(error);

        await expect(consumer.handleMessage(payload)).rejects.toThrow(
          'Database connection failed',
        );
      });

      it('should catch DomainBusinessException for invalid action and not throw', async () => {
        const payload: MercadoPagoProcessPaymentQueueMessage = {
          paymentReference: PAYMENT_REFERENCE,
          webhookPayload: {
            action: 'order.unknown' as MercadoPagoOrderAction,
          },
        };

        await expect(consumer.handleMessage(payload)).resolves.toBeUndefined();
      });

      it('should log warning for invalid action', async () => {
        const payload: MercadoPagoProcessPaymentQueueMessage = {
          paymentReference: PAYMENT_REFERENCE,
          webhookPayload: {
            action: 'order.unknown' as MercadoPagoOrderAction,
          },
        };

        await consumer.handleMessage(payload);

        expect(
          logger.warnings.some(
            (w) => w.message === 'Failed to process payment',
          ),
        ).toBe(true);
      });
    });
  });
});
