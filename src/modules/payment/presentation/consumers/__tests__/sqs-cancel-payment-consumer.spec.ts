import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { CancelPaymentGateway } from '@payment/domain/gateways/cancel-payment.gateway';
import {
  CancelPaymentConsumer,
  CancelPaymentConsumerPayload,
} from '@payment/presentation/consumers/sqs-cancel-payment-consumer';
import { FakeLogger } from '@test/fakes';

describe('CancelPaymentConsumer - Unit Test', () => {
  let consumer: CancelPaymentConsumer;
  let mockCancelPaymentGateway: jest.Mocked<CancelPaymentGateway>;
  let logger: FakeLogger;

  const ORDER_ID = 'ORD01J49MMW3SSBK5PSV3DFR32959';

  beforeEach(() => {
    process.env.AWS_SQS_CANCEL_PAYMENT_QUEUE_URL =
      'http://localhost:4566/queue/cancel-payment';
    process.env.AWS_SQS_CANCEL_PAYMENT_DLQ_URL =
      'http://localhost:4566/queue/cancel-payment-dlq';

    mockCancelPaymentGateway = {
      cancelPayment: jest.fn(),
    };
    logger = new FakeLogger();
    consumer = new CancelPaymentConsumer(logger, mockCancelPaymentGateway);
  });

  afterEach(() => {
    delete process.env.AWS_SQS_CANCEL_PAYMENT_QUEUE_URL;
    delete process.env.AWS_SQS_CANCEL_PAYMENT_DLQ_URL;
  });

  describe('handleMessage', () => {
    describe('Success', () => {
      it('should call cancelPaymentGateway with orderId', async () => {
        const payload: CancelPaymentConsumerPayload = { orderId: ORDER_ID };
        mockCancelPaymentGateway.cancelPayment.mockResolvedValue(Result.ok());

        await consumer.handleMessage(payload);

        expect(mockCancelPaymentGateway.cancelPayment).toHaveBeenCalledWith(
          ORDER_ID,
        );
      });

      it('should log start and success messages', async () => {
        const payload: CancelPaymentConsumerPayload = { orderId: ORDER_ID };
        mockCancelPaymentGateway.cancelPayment.mockResolvedValue(Result.ok());

        await consumer.handleMessage(payload);

        expect(logger.logs).toContainEqual({
          message: 'Iniciando cancelamento de order no Mercado Pago',
          context: { orderId: ORDER_ID },
        });
        expect(logger.logs).toContainEqual({
          message: 'Order cancelada com sucesso no Mercado Pago',
          context: { orderId: ORDER_ID },
        });
      });

      it('should complete without throwing when gateway succeeds', async () => {
        const payload: CancelPaymentConsumerPayload = { orderId: ORDER_ID };
        mockCancelPaymentGateway.cancelPayment.mockResolvedValue(Result.ok());

        await expect(consumer.handleMessage(payload)).resolves.toBeUndefined();
      });
    });

    describe('Error', () => {
      it('should throw error when gateway fails', async () => {
        const payload: CancelPaymentConsumerPayload = { orderId: ORDER_ID };
        const error = new DomainBusinessException('Falha ao cancelar order');
        mockCancelPaymentGateway.cancelPayment.mockResolvedValue(
          Result.fail(error),
        );

        await expect(consumer.handleMessage(payload)).rejects.toThrow(error);
      });

      it('should log error when gateway fails', async () => {
        const payload: CancelPaymentConsumerPayload = { orderId: ORDER_ID };
        const error = new DomainBusinessException('Falha ao cancelar order');
        mockCancelPaymentGateway.cancelPayment.mockResolvedValue(
          Result.fail(error),
        );

        await expect(consumer.handleMessage(payload)).rejects.toThrow();

        expect(logger.errors).toContainEqual({
          message: 'Falha ao cancelar order no Mercado Pago',
          context: { orderId: ORDER_ID, error: 'Falha ao cancelar order' },
        });
      });
    });
  });
});
