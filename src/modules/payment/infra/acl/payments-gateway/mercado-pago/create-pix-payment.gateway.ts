import {
  DomainBusinessException,
  DomainExceptionGeneric,
} from '@core/domain/exceptions/domain.exception';
import {
  HttpClientResponseUtils,
  PostMethod,
} from '@core/infra/http/client/http-client';
import {
  AnyCreatePaymentType,
  CreateAnyPaymentResponse,
  CreatePaymentGateway,
  isPixCreatePaymentType,
} from '@payment/domain/gateways/create-payment.gateway';
import {
  CreateQRCodeMercadoPagoRequest,
  CreateQRCodeMercadoPagoRequestSchema,
  CreateQRCodeMercadoPagoResponse,
  CreateQRCodeMercadoPagoResponseSchema,
} from './dtos/mercadopago-qrcode.dto';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { Result } from '@core/domain/result';

export class CreatePixPaymentGatewayImpl implements CreatePaymentGateway {
  private readonly URL = `${process.env.MERCADO_PAGO_API_URL}/v1/orders`;

  constructor(
    private readonly client: PostMethod,
    private readonly logger: AbstractLoggerService,
  ) {}

  private toIsoDuration(expiration: Date, now: Date = new Date()): string {
    const diffMs = expiration.getTime() - now.getTime();
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let duration = 'PT';
    if (hours) duration += `${hours}H`;
    if (minutes) duration += `${minutes}M`;
    if (seconds) duration += `${seconds}S`;
    return duration;
  }

  async createPayment(
    payment: AnyCreatePaymentType,
  ): Promise<Result<CreateAnyPaymentResponse>> {

    this.logger.log('Creating payment', {
      externalReference: payment.externalReference,
    });

    if (!isPixCreatePaymentType(payment)) {
      this.logger.warn('Payment type not supported', {
        payment: payment,
      });
      return Result.fail(new DomainBusinessException('Tipo de pagamento não suportado'));
    }
    this.logger.log('Creating items');
    const items = payment.items.map((item) => ({
      title: item.title,
      unit_price: item.unitPrice.toFixed(2),
      quantity: item.quantity,
      unit_measure: 'unit',
    }));

    this.logger.log('Creating MercadoPago payload');
    const mercadoPagoPayload: CreateQRCodeMercadoPagoRequest = {
      type: 'qr',
      total_amount: payment.amount.toFixed(2),
      expiration_time: this.toIsoDuration(payment.expirationTime),
      external_reference: payment.externalReference,
      config: {
        qr: {
          external_pos_id: process.env.MERCADO_PAGO_POS_ID as string,
          mode: 'dynamic',
        },
      },
      transactions: {
        payments: [
          {
            amount: payment.amount.toFixed(2),
          },
        ],
      },
      items,
    };

    this.logger.log('Validating MercadoPago payload');
    const validationResult =
      CreateQRCodeMercadoPagoRequestSchema.safeParse(mercadoPagoPayload);

    if (!validationResult.success) {
      this.logger.error('Error validating MercadoPago payload', {
        error: validationResult.error,
      });
      return Result.fail(new DomainBusinessException(
        `Erro na validação do payload do MercadoPago: ${validationResult.error.message}`,
      ));
    }

    this.logger.log('Sending request to MercadoPago');
    const response = await this.client.post<
      CreateQRCodeMercadoPagoRequest,
      CreateQRCodeMercadoPagoResponse
    >(this.URL, validationResult.data, {
      Authorization: `Bearer ${process.env.MERCADO_PAGO_PAYMENT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': payment.idempotencyKey,
    });

    if (HttpClientResponseUtils.isErrorResponse(response)) {
      this.logger.error('Error sending request to MercadoPago', {
        error: response.data,
      });
      return Result.fail(HttpClientResponseUtils.handleErrorResponse(response.data));
    }

    if (HttpClientResponseUtils.isEmptyResponse(response)) {
      this.logger.error('Empty response from MercadoPago', {
        response: response,
      });
      return Result.fail(new DomainExceptionGeneric(
        'Ocorreu um erro inesperado, entre em contato com o suporte.',
      ));
    }
    this.logger.log('Parsing response from MercadoPago');

    const responseValidation = CreateQRCodeMercadoPagoResponseSchema.safeParse(
      response.data,
    );

    if (!responseValidation.success) {
      this.logger.error('Error parsing response from MercadoPago', {
        error: responseValidation.error,
      });
      return Result.fail(new DomainExceptionGeneric(
        `Erro na validação da resposta do MercadoPago: ${responseValidation.error.message}`,
      ));
    }

    this.logger.log('Successfully created payment');

    return Result.ok({
      qrCode: responseValidation.data.type_response.qr_data,
    });
  }
}
