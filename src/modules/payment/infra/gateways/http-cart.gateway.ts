import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import {
  GetMethod,
  HttpClientResponseUtils,
} from '@core/infra/http/client/http-client';
import {
  CartGateway,
  GetCartDetailsOutput,
} from '@payment/domain/gateways/cart.gateway';

import { CartResponseDto } from './dtos';

export class HttpCartGateway implements CartGateway {
  private readonly BASE_URL = process.env.CART_API_URL;

  constructor(private readonly httpClient: GetMethod) {}

  async getCart(_sessionId: string): Promise<GetCartDetailsOutput> {
    const response = await this.httpClient.get<CartResponseDto>(
      `${this.BASE_URL}/v1/cart`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': _sessionId,
        },
      },
    );

    const data = response.data;

    if (HttpClientResponseUtils.isErrorResponse(response)) {
      throw HttpClientResponseUtils.handleErrorResponse(response);
    }

    if (HttpClientResponseUtils.isEmptyResponse(response)) {
      throw HttpClientResponseUtils.handleErrorResponse('Carrinho vazio');
    }

    const cartDto = plainToInstance(CartResponseDto, data);
    const errors = validateSync(cartDto);

    if (errors.length > 0) {
      const messages = errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .join('; ');
      throw new Error(`Resposta inválida do carrinho: ${messages}`);
    }

    return {
      items: cartDto.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };
  }
}
