import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsConsumer } from '@core/infra/sqs/sqs-consumer';
import { Inject, Injectable } from '@nestjs/common';
import {
  MarkAsPaidGateway,
  type MarkAsPaidGateway as MarkAsPaidGatewayType,
} from '@payment/domain/gateways/mark-as-paid';
import type { MercadoPagoProcessPaymentQueueMessage } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/mercado-pago-mark-as-paid-queue.dto';
import {
  MercadoPagoOrderAction,
  type ProcessPaymentDTOSchemaRequest,
} from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';

const MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL_ENV =
  'AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL';

@Injectable()
export class MercadoPagoProcessPaymentConsumer extends SqsConsumer<MercadoPagoProcessPaymentQueueMessage> {
  constructor(
    logger: AbstractLoggerService,
    @Inject(MarkAsPaidGateway)
    private readonly markAsPaidGateway: MarkAsPaidGatewayType<ProcessPaymentDTOSchemaRequest>,
  ) {
    super(logger, MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL_ENV);
  }

  async handleMessage(
    payload: MercadoPagoProcessPaymentQueueMessage,
  ): Promise<void> {
    this.logger.log('Processing Mercado Pago payment message', {
      paymentReference: payload.paymentReference,
      action: payload.webhookPayload?.action,
      payload: JSON.stringify(payload),
    });

    if (!payload.paymentReference) {
      this.logger.warn('Ignoring message without paymentReference', {
        payload,
      });
      return;
    }

    const action = payload.webhookPayload?.action;

    if (action === MercadoPagoOrderAction.PROCESSED) {
      this.logger.log('Processing Mercado Pago payment message', {
        paymentReference: payload.paymentReference,
        action,
        payload: JSON.stringify(payload),
      });
      const result = await this.markAsPaidGateway.markAsPaid(
        payload.paymentReference,
        payload.webhookPayload,
      );

      if (result.isSuccess) {
        this.logger.log('Payment processed successfully', {
          paymentReference: payload.paymentReference,
          action,
        });
        return;
      }

      const errorMessage = result.error?.message ?? 'Unknown error';
      const errorType = result.error?.constructor?.name ?? 'UnknownError';

      this.logger.error('Failed to process payment', {
        paymentReference: payload.paymentReference,
        action,
        error: errorMessage,
        errorType: errorType,
      });

      return;
    }
    this.logger.warn('Ignoring message with unknown action', {
      payload,
    });
    return;
  }
}
