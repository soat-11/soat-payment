import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { MarkAsPaidStrategy } from '@payment/application/strategies/mark-as-paid.strategy';
import { MarkAsPaidGateway } from '@payment/domain/gateways/mark-as-paid';

describe('MarkAsPaidStrategy - Unit Test', () => {
  let strategy: MarkAsPaidStrategy;
  let mockMarkAsPaidGateway: jest.Mocked<MarkAsPaidGateway>;

  beforeEach(() => {
    mockMarkAsPaidGateway = {
      markAsPaid: jest.fn(),
    };
    strategy = new MarkAsPaidStrategy(mockMarkAsPaidGateway);
  });

  describe('Success', () => {
    it('should call markAsPaid gateway with paymentReference', async () => {
      const paymentReference = 'payment-123';
      mockMarkAsPaidGateway.markAsPaid.mockResolvedValue(Result.ok());

      const result = await strategy.execute(paymentReference);

      expect(result.isSuccess).toBe(true);
      expect(mockMarkAsPaidGateway.markAsPaid).toHaveBeenCalledWith(
        paymentReference,
      );
      expect(mockMarkAsPaidGateway.markAsPaid).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error', () => {
    it('should return failure when gateway fails', async () => {
      const error = new DomainBusinessException('Gateway error');
      mockMarkAsPaidGateway.markAsPaid.mockResolvedValue(Result.fail(error));

      const result = await strategy.execute('payment-123');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });
  });
});
