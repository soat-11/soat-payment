import {
  CartGateway,
  GetCartDetailsOutput,
} from '@payment/domain/gateways/cart.gateway';

export class FakeCartGateway implements CartGateway {
  private cartResponse: GetCartDetailsOutput = {
    items: [
      { sku: '123', quantity: 2, unitPrice: 100 },
      { sku: '456', quantity: 1, unitPrice: 50 },
    ],
  };

  async getCart(sessionId: string): Promise<GetCartDetailsOutput> {
    return this.cartResponse;
  }

  setCartResponse(response: GetCartDetailsOutput): void {
    this.cartResponse = response;
  }
}
