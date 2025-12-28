import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { PaymentProcessingStrategy } from '@payment/application/strategies';
import { PaymentProcessorUseCaseImpl } from '@payment/application/use-cases/payment-processor/payment-processor-impl.use-case';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { FakeLogger } from '@test/fakes';

describe('PaymentProcessorUseCaseImpl - Unit Test', () => {
  let useCase: PaymentProcessorUseCaseImpl;
  let mockStrategies: Map<PaymentStatus, PaymentProcessingStrategy>;
  let mockPaidStrategy: jest.Mocked<PaymentProcessingStrategy>;
  let mockCancelStrategy: jest.Mocked<PaymentProcessingStrategy>;
  let mockRefundStrategy: jest.Mocked<PaymentProcessingStrategy>;
  let logger: FakeLogger;

  beforeEach(() => {
    mockPaidStrategy = { execute: jest.fn() };
    mockCancelStrategy = { execute: jest.fn() };
    mockRefundStrategy = { execute: jest.fn() };

    mockStrategies = new Map([
      [PaymentStatus.PAID, mockPaidStrategy],
      [PaymentStatus.CANCELED, mockCancelStrategy],
      [PaymentStatus.REFUNDED, mockRefundStrategy],
    ]);

    logger = new FakeLogger();
    useCase = new PaymentProcessorUseCaseImpl(mockStrategies, logger);
  });

  describe('Success', () => {
    it('should execute PAID strategy when status is PAID', async () => {
      mockPaidStrategy.execute.mockResolvedValue(Result.ok());

      const result = await useCase.execute({
        paymentReference: 'ref-123',
        status: PaymentStatus.PAID,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockPaidStrategy.execute).toHaveBeenCalledWith('ref-123');
      expect(mockCancelStrategy.execute).not.toHaveBeenCalled();
      expect(mockRefundStrategy.execute).not.toHaveBeenCalled();
    });

    it('should execute CANCELED strategy when status is CANCELED', async () => {
      mockCancelStrategy.execute.mockResolvedValue(Result.ok());

      const result = await useCase.execute({
        paymentReference: 'ref-123',
        status: PaymentStatus.CANCELED,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockCancelStrategy.execute).toHaveBeenCalledWith('ref-123');
      expect(mockPaidStrategy.execute).not.toHaveBeenCalled();
      expect(mockRefundStrategy.execute).not.toHaveBeenCalled();
    });

    it('should execute REFUNDED strategy when status is REFUNDED', async () => {
      mockRefundStrategy.execute.mockResolvedValue(Result.ok());

      const result = await useCase.execute({
        paymentReference: 'ref-123',
        status: PaymentStatus.REFUNDED,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockRefundStrategy.execute).toHaveBeenCalledWith('ref-123');
      expect(mockPaidStrategy.execute).not.toHaveBeenCalled();
      expect(mockCancelStrategy.execute).not.toHaveBeenCalled();
    });

    it('should log processing message', async () => {
      mockPaidStrategy.execute.mockResolvedValue(Result.ok());

      await useCase.execute({
        paymentReference: 'ref-123',
        status: PaymentStatus.PAID,
      });

      expect(logger.logs).toContainEqual({
        message: 'Processando pagamento',
        context: {
          paymentReference: 'ref-123',
          status: PaymentStatus.PAID,
        },
      });
    });
  });

  describe('Error', () => {
    it('should return failure when status has no strategy', async () => {
      const result = await useCase.execute({
        paymentReference: 'ref-123',
        status: PaymentStatus.PENDING,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
      expect(result.error.message).toBe(
        'Status de pagamento inválido, não é possível processar o pagamento',
      );
    });

    it('should log when status has no strategy', async () => {
      await useCase.execute({
        paymentReference: 'ref-123',
        status: PaymentStatus.PENDING,
      });

      expect(logger.logs).toContainEqual({
        message:
          'Status de pagamento inválido, não é possível processar o pagamento',
        context: {
          paymentReference: 'ref-123',
          status: PaymentStatus.PENDING,
        },
      });
    });

    it('should propagate strategy failure', async () => {
      const error = new DomainBusinessException('Strategy error');
      mockPaidStrategy.execute.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute({
        paymentReference: 'ref-123',
        status: PaymentStatus.PAID,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });
  });
});
