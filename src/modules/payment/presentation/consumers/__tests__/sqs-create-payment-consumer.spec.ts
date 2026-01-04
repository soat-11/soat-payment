import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { CreatePaymentConsumer } from '@payment/presentation/consumers/sqs-create-payment-consumer';
import { CreatePaymentDto } from '@payment/presentation/dto/request/create-payment.dto';
import { FakeLogger } from '@test/fakes';

describe('CreatePaymentConsumer - Unit Test', () => {
  let consumer: CreatePaymentConsumer;
  let mockCreatePaymentUseCase: jest.Mocked<CreatePaymentUseCase>;
  let logger: FakeLogger;

  const SESSION_ID = 'session-123';
  const IDEMPOTENCY_KEY = 'idempotency-key-456';
  const PAYMENT_ID = 'payment-789';

  beforeEach(() => {
    process.env.AWS_SQS_CREATE_PAYMENT_QUEUE_URL =
      'http://localhost:4566/queue/create-payment';

    mockCreatePaymentUseCase = {
      execute: jest.fn(),
    };
    logger = new FakeLogger();
    consumer = new CreatePaymentConsumer(logger, mockCreatePaymentUseCase);
  });

  afterEach(() => {
    delete process.env.AWS_SQS_CREATE_PAYMENT_QUEUE_URL;
  });

  describe('handleMessage', () => {
    describe('Success', () => {
      it('should call createPaymentUseCase with correct parameters', async () => {
        const payload: CreatePaymentDto = {
          sessionId: SESSION_ID,
          idempotencyKey: IDEMPOTENCY_KEY,
        };
        mockCreatePaymentUseCase.execute.mockResolvedValue(
          Result.ok({ paymentId: PAYMENT_ID as string, image: 'image-test' }),
        );

        await consumer.handleMessage(payload);

        expect(mockCreatePaymentUseCase.execute).toHaveBeenCalledWith({
          sessionId: SESSION_ID,
          idempotencyKey: IDEMPOTENCY_KEY,
        });
      });

      it('should log creating and created messages on success', async () => {
        const payload: CreatePaymentDto = {
          sessionId: SESSION_ID,
          idempotencyKey: IDEMPOTENCY_KEY,
        };
        mockCreatePaymentUseCase.execute.mockResolvedValue(
          Result.ok({ paymentId: PAYMENT_ID as string, image: 'image-test' }),
        );

        await consumer.handleMessage(payload);

        expect(logger.logs).toContainEqual({
          message: 'Creating payment',
          context: { sessionId: SESSION_ID, idempotencyKey: IDEMPOTENCY_KEY },
        });
        expect(logger.logs).toContainEqual({
          message: 'Payment created',
          context: { paymentId: PAYMENT_ID },
        });
      });

      it('should complete without throwing on success', async () => {
        const payload: CreatePaymentDto = {
          sessionId: SESSION_ID,
          idempotencyKey: IDEMPOTENCY_KEY,
        };
        mockCreatePaymentUseCase.execute.mockResolvedValue(
          Result.ok({ paymentId: PAYMENT_ID as string, image: 'image-test' }),
        );

        await expect(consumer.handleMessage(payload)).resolves.toBeUndefined();
      });
    });

    describe('Error (no retry)', () => {
      it('should log error but NOT throw when use case fails', async () => {
        const payload: CreatePaymentDto = {
          sessionId: SESSION_ID,
          idempotencyKey: IDEMPOTENCY_KEY,
        };
        const error = new DomainBusinessException('Payment already exists');
        mockCreatePaymentUseCase.execute.mockResolvedValue(Result.fail(error));

        await expect(consumer.handleMessage(payload)).resolves.toBeUndefined();
      });

      it('should log error with details when use case fails', async () => {
        const payload: CreatePaymentDto = {
          sessionId: SESSION_ID,
          idempotencyKey: IDEMPOTENCY_KEY,
        };
        const error = new DomainBusinessException('Payment already exists');
        mockCreatePaymentUseCase.execute.mockResolvedValue(Result.fail(error));

        await consumer.handleMessage(payload);

        expect(logger.errors).toContainEqual({
          message: 'Failed to create payment (no retry)',
          context: {
            error: 'Payment already exists',
            errorType: 'DomainBusinessException',
            idempotencyKey: IDEMPOTENCY_KEY,
          },
        });
      });
    });
  });
});
