import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import {
  GetMethod,
  HttpClientResponseUtils,
  PostMethod,
} from '@core/infra/http/client/http-client';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { CancelPaymentGateway } from '@payment/domain/gateways/cancel-payment.gateway';

type MercadoPagoOrderStatus =
  | 'created'
  | 'action_required'
  | 'processed'
  | 'paid'
  | 'canceled'
  | 'refunded'
  | 'expired';

type MercadoPagoOrderResponse = {
  id: string;
  status: MercadoPagoOrderStatus;
};

const CANCELABLE_STATUSES: MercadoPagoOrderStatus[] = [
  'created',
  'action_required',
];
const REFUNDABLE_STATUSES: MercadoPagoOrderStatus[] = ['paid', 'processed'];

/**
 * Gateway para cancelar/reembolsar orders no Mercado Pago
 *
 * Fluxo:
 * 1. Consulta status da order via GET /v1/orders/{order_id}
 * 2. Se status for 'created' ou 'action_required' -> POST /cancel
 * 3. Se status for 'paid' ou 'processed' -> POST /refund
 * 4. Se status for outro -> retorna erro (DomainBusinessException)
 *
 * Nota: Este gateway NÃO atualiza o status interno do pagamento.
 * O Mercado Pago enviará um webhook que será processado pelo
 * process-payment-consumer para atualizar o status interno.
 */
export class MercadoPagoCancelPaymentGatewayImpl
  implements CancelPaymentGateway
{
  private readonly BASE_URL = process.env.MERCADO_PAGO_API_URL;
  private readonly PAYMENT_ACCESS_TOKEN =
    process.env.MERCADO_PAGO_PAYMENT_ACCESS_TOKEN;
  constructor(
    private readonly httpClient: GetMethod & PostMethod,
    private readonly logger: AbstractLoggerService,
  ) {}

  async cancelPayment(orderId: string): Promise<Result<void>> {
    this.logger.log(
      'Iniciando cancelamento/reembolso de order no Mercado Pago',
      {
        orderId,
      },
    );

    const orderStatusResult = await this.getOrderStatus(orderId);
    if (orderStatusResult.isFailure) {
      return Result.fail(orderStatusResult.error);
    }

    const status = orderStatusResult.value;

    if (CANCELABLE_STATUSES.includes(status)) {
      return this.cancelOrder(orderId);
    }

    if (REFUNDABLE_STATUSES.includes(status)) {
      return this.refundOrder(orderId);
    }

    this.logger.error('Status da order não permite cancelamento/reembolso', {
      orderId,
      status,
    });
    return Result.fail(
      new DomainBusinessException(
        `Order com status '${status}' não pode ser cancelada ou reembolsada`,
      ),
    );
  }

  private async getOrderStatus(
    orderId: string,
  ): Promise<Result<MercadoPagoOrderStatus>> {
    this.logger.log('Consultando status da order no Mercado Pago', { orderId });

    const response = await this.httpClient.get<MercadoPagoOrderResponse>(
      `${this.BASE_URL}/v1/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${this.PAYMENT_ACCESS_TOKEN}`,
        },
      },
    );

    if (HttpClientResponseUtils.isErrorResponse(response)) {
      this.logger.error('Erro ao consultar order no Mercado Pago', {
        orderId,
        status: response.status,
        error: response.data,
      });
      return Result.fail(
        new DomainBusinessException('Falha ao consultar order no Mercado Pago'),
      );
    }

    if (!response.data?.status) {
      this.logger.error('Resposta inválida da API do Mercado Pago', {
        orderId,
        data: response.data,
      });
      return Result.fail(
        new DomainBusinessException('Resposta inválida da API do Mercado Pago'),
      );
    }

    this.logger.log('Status da order obtido com sucesso', {
      orderId,
      status: response.data.status,
    });

    return Result.ok(response.data.status);
  }

  private async cancelOrder(orderId: string): Promise<Result<void>> {
    this.logger.log('Cancelando order no Mercado Pago', { orderId });

    const response = await this.httpClient.post(
      `${this.BASE_URL}/v1/orders/${orderId}/cancel`,
      {},
      {
        Authorization: `Bearer ${this.PAYMENT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
    );

    if (HttpClientResponseUtils.isErrorResponse(response)) {
      this.logger.error('Erro ao cancelar order no Mercado Pago', {
        orderId,
        status: response.status,
        error: response.data,
      });
      return Result.fail(
        new DomainBusinessException('Falha ao cancelar order no Mercado Pago'),
      );
    }

    this.logger.log('Order cancelada com sucesso no Mercado Pago', { orderId });
    return Result.ok();
  }

  private async refundOrder(orderId: string): Promise<Result<void>> {
    this.logger.log('Reembolsando order no Mercado Pago', { orderId });

    const response = await this.httpClient.post(
      `${this.BASE_URL}/v1/orders/${orderId}/refund`,
      {},
      {
        Authorization: `Bearer ${this.PAYMENT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
    );

    if (HttpClientResponseUtils.isErrorResponse(response)) {
      this.logger.error('Erro ao reembolsar order no Mercado Pago', {
        orderId,
        status: response.status,
        error: response.data,
      });
      return Result.fail(
        new DomainBusinessException(
          'Falha ao reembolsar order no Mercado Pago',
        ),
      );
    }

    this.logger.log('Order reembolsada com sucesso no Mercado Pago', {
      orderId,
    });
    return Result.ok();
  }
}
