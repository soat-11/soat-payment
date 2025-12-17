import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { RefundPaymentStrategy } from '@payment/application/strategies/refund-payment.strategy';
import { RefundPaymentUseCase } from '@payment/application/use-cases/refund-payment/refund-payment.use-case';

describe('RefundPaymentStrategy - Unit Test', () => {
  let strategy: RefundPaymentStrategy;
  let mockRefundPaymentUseCase: jest.Mocked<RefundPaymentUseCase>;

  beforeEach(() => {
    mockRefundPaymentUseCase = {
      execute: jest.fn(),
    };
    strategy = new RefundPaymentStrategy(mockRefundPaymentUseCase);
  });

  describe('Success', () => {
    it('should call refundPaymentUseCase with paymentReference', async () => {
      const paymentReference = 'payment-123';
      mockRefundPaymentUseCase.execute.mockResolvedValue(
        Result.ok({ refundedAt: new Date() }),
      );

      const result = await strategy.execute(paymentReference);

      expect(result.isSuccess).toBe(true);
      expect(mockRefundPaymentUseCase.execute).toHaveBeenCalledWith({
        paymentReference,
      });
      expect(mockRefundPaymentUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error', () => {
    it('should return failure when use case fails', async () => {
      const error = new DomainBusinessException('Refund error');
      mockRefundPaymentUseCase.execute.mockResolvedValue(Result.fail(error));

      const result = await strategy.execute('payment-123');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });
  });
});
