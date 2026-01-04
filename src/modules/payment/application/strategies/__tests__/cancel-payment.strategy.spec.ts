import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { CancelPaymentStrategy } from '@payment/application/strategies/cancel-payment.strategy';
import { CancelPaymentUseCase } from '@payment/application/use-cases/cancel-payment/cancel-payment.use-case';

describe('CancelPaymentStrategy - Unit Test', () => {
  let strategy: CancelPaymentStrategy;
  let mockCancelPaymentUseCase: jest.Mocked<CancelPaymentUseCase>;

  beforeEach(() => {
    mockCancelPaymentUseCase = {
      execute: jest.fn(),
    };
    strategy = new CancelPaymentStrategy(mockCancelPaymentUseCase);
  });

  describe('Success', () => {
    it('should call cancelPaymentUseCase with paymentReference', async () => {
      const paymentReference = 'payment-123';
      mockCancelPaymentUseCase.execute.mockResolvedValue(
        Result.ok({ canceledAt: new Date() }),
      );

      const result = await strategy.execute(paymentReference);

      expect(result.isSuccess).toBe(true);
      expect(mockCancelPaymentUseCase.execute).toHaveBeenCalledWith({
        paymentReference,
      });
      expect(mockCancelPaymentUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error', () => {
    it('should return failure when use case fails', async () => {
      const error = new DomainBusinessException('Cancel error');
      mockCancelPaymentUseCase.execute.mockResolvedValue(Result.fail(error));

      const result = await strategy.execute('payment-123');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });
  });
});
