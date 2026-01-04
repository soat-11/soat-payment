import { GetCartDetailsOutput } from '@payment/domain/gateways/cart.gateway';

export interface PaymentAmountCalculator {
  calculate(cart: GetCartDetailsOutput): number;
}

export const PaymentAmountCalculator = Symbol('PaymentAmountCalculator');

export class PaymentAmountCalculatorImpl implements PaymentAmountCalculator {
  calculate(cart: GetCartDetailsOutput): number {
    return cart.items.reduce((total, item) => {
      return total + item.unitPrice * item.quantity;
    }, 0);
  }
}
