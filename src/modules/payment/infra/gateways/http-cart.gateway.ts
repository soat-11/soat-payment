import {
  CartGateway,
  GetCartDetailsOutput,
} from '@payment/domain/gateways/cart.gateway';

export class HttpCartGateway implements CartGateway {
  async getCart(sessionId: string): Promise<GetCartDetailsOutput> {
    return {
      items: [
        {
          sku: '123',
          quantity: 2,
          unitPrice: 100,
        },
      ],
    };
  }
}
