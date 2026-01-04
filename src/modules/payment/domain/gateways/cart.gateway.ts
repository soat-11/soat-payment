export type GetCartItemResponse = {
  sku: string;
  quantity: number;
  unitPrice: number;
};

export type GetCartDetailsOutput = {
  items: GetCartItemResponse[];
};

export interface CartGateway {
  getCart(sessionId: string): Promise<GetCartDetailsOutput>;
}

export const CartGateway = Symbol('CartGateway');
