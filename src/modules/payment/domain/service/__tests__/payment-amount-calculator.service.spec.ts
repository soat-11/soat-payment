import { PaymentAmountCalculatorImpl } from '@modules/payment/domain/service/payment-amount-calculator.service';
import { GetCartDetailsOutput } from '@payment/domain/gateways/cart.gateway';

describe('PaymentAmountCalculator', () => {
  let calculator: PaymentAmountCalculatorImpl;

  beforeEach(() => {
    calculator = new PaymentAmountCalculatorImpl();
  });

  it('should calculate the total amount correctly', () => {
    const cart: GetCartDetailsOutput = {
      items: [
        { sku: 'A', quantity: 2, unitPrice: 50 },
        { sku: 'B', quantity: 1, unitPrice: 30 },
      ],
    };

    const total = calculator.calculate(cart);

    expect(total).toBe(130);
  });

  it('should return 0 for an empty cart', () => {
    const cart: GetCartDetailsOutput = {
      items: [],
    };

    const total = calculator.calculate(cart);

    expect(total).toBe(0);
  });
});
