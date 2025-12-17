import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { MercadoPagoProcessPaymentQueueMessage } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/mercado-pago-mark-as-paid-queue.dto';
import { MercadoPagoOrderAction } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';
import { SqsMercadoPagoProcessPaymentPublish } from '@payment/infra/acl/payments-gateway/mercado-pago/publishers/mercado-pago-mark-as-paid.publish';
import { FakeLogger } from '@test/fakes';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

const sqsMock = mockClient(SQSClient);

describe('SqsMercadoPagoProcessPaymentPublish - Unit Test', () => {
  let publisher: SqsMercadoPagoProcessPaymentPublish;
  let logger: FakeLogger;

  const QUEUE_URL = 'http://localhost:4566/queue/process-payment';
  const PAYMENT_REFERENCE = 'ORD01J49MMW3SSBK5PSV3DFR32959';

  beforeEach(() => {
    process.env.AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL = QUEUE_URL;
    process.env.AWS_REGION = 'us-east-1';

    sqsMock.reset();
    logger = new FakeLogger();
    publisher = new SqsMercadoPagoProcessPaymentPublish(logger);
  });

  afterEach(() => {
    delete process.env.AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL;
    delete process.env.AWS_REGION;
  });

  describe('publish', () => {
    it('should send message to SQS with correct queue URL', async () => {
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'msg-123' });

      const message: MercadoPagoProcessPaymentQueueMessage = {
        paymentReference: PAYMENT_REFERENCE,
        webhookPayload: { action: MercadoPagoOrderAction.PROCESSED },
      };

      await publisher.publish(message);

      expect(sqsMock).toHaveReceivedCommandWith(SendMessageCommand, {
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(message),
      });
    });

    it('should log publishing message', async () => {
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'msg-123' });

      const message: MercadoPagoProcessPaymentQueueMessage = {
        paymentReference: PAYMENT_REFERENCE,
        webhookPayload: { action: MercadoPagoOrderAction.PROCESSED },
      };

      await publisher.publish(message);

      expect(
        logger.logs.some((log) => log.message === 'Publishing message'),
      ).toBe(true);
    });

    it('should throw error when SQS send fails', async () => {
      sqsMock
        .on(SendMessageCommand)
        .rejects(new Error('SQS connection failed'));

      const message: MercadoPagoProcessPaymentQueueMessage = {
        paymentReference: PAYMENT_REFERENCE,
        webhookPayload: { action: MercadoPagoOrderAction.PROCESSED },
      };

      await expect(publisher.publish(message)).rejects.toThrow(
        'Failed to publish message',
      );
    });

    it('should log error when SQS send fails', async () => {
      sqsMock
        .on(SendMessageCommand)
        .rejects(new Error('SQS connection failed'));

      const message: MercadoPagoProcessPaymentQueueMessage = {
        paymentReference: PAYMENT_REFERENCE,
        webhookPayload: { action: MercadoPagoOrderAction.PROCESSED },
      };

      await expect(publisher.publish(message)).rejects.toThrow();

      expect(
        logger.errors.some((log) => log.message === 'Error publishing message'),
      ).toBe(true);
    });

    it('should publish messages with different actions', async () => {
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'msg-123' });

      const actions = [
        MercadoPagoOrderAction.PROCESSED,
        MercadoPagoOrderAction.REFUNDED,
        MercadoPagoOrderAction.CANCELED,
      ];

      for (const action of actions) {
        await publisher.publish({
          paymentReference: PAYMENT_REFERENCE,
          webhookPayload: { action },
        });
      }

      expect(sqsMock).toHaveReceivedCommandTimes(SendMessageCommand, 3);
    });
  });

  describe('configuration errors', () => {
    it('should throw error when queue URL is not configured', async () => {
      delete process.env.AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL;

      const newPublisher = new SqsMercadoPagoProcessPaymentPublish(logger);
      const message: MercadoPagoProcessPaymentQueueMessage = {
        paymentReference: PAYMENT_REFERENCE,
        webhookPayload: { action: MercadoPagoOrderAction.PROCESSED },
      };

      await expect(newPublisher.publish(message)).rejects.toThrow(
        'Queue URL not found',
      );
    });

    it('should log error when queue URL is not configured', async () => {
      delete process.env.AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL;

      const newPublisher = new SqsMercadoPagoProcessPaymentPublish(logger);
      const message: MercadoPagoProcessPaymentQueueMessage = {
        paymentReference: PAYMENT_REFERENCE,
        webhookPayload: { action: MercadoPagoOrderAction.PROCESSED },
      };

      await expect(newPublisher.publish(message)).rejects.toThrow();

      expect(logger.errors).toContainEqual({
        message: 'Queue URL not configured',
        context: {
          resource: 'SqsMercadoPagoProcessPaymentPublish',
          envVar: 'AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL',
        },
      });
    });
  });
});
