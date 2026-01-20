import { Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(HttpCartGateway.name);

  constructor(private readonly httpClient: GetMethod) {}

  async getCart(_sessionId: string): Promise<GetCartDetailsOutput> {
    this.logger.log(
      `[OUT] Buscando carrinho. SessionID Solicitado: ${_sessionId} | URL: ${this.BASE_URL}`,
    );
    const response = await this.httpClient.get<CartResponseDto>(
      `${this.BASE_URL}/cart`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': _sessionId,
        },
      },
    );

    this.logger.log(
      `[IN] Resposta do Cart Service. Status: ${response.status}`,
    );

    const body = response.data;

    this.logger.log(
      `[IN] Payload recebido HttpCartGateway: ${JSON.stringify(body)}`,
    );

    if (HttpClientResponseUtils.isErrorResponse(response)) {
      throw HttpClientResponseUtils.handleErrorResponse(response);
    }

    if (HttpClientResponseUtils.isEmptyResponse(response)) {
      throw HttpClientResponseUtils.handleErrorResponse('Carrinho vazio');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cartPayload = (body as any).data || body;

    const cartDto = plainToInstance(CartResponseDto, cartPayload);
    const errors = validateSync(cartDto);

    if (errors.length > 0) {
      const messages = errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .join('; ');

      this.logger.error(
        `Falha na validação. Payload usado: ${JSON.stringify(cartPayload)}`,
      );
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
