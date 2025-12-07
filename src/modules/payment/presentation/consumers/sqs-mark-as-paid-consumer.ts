import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsConsumer } from '@core/infra/sqs/sqs-consumer';
import { Inject, Injectable } from '@nestjs/common';
import {
  MarkAsPaidGateway,
  type MarkAsPaidGateway as MarkAsPaidGatewayType,
} from '@payment/domain/gateways/mark-as-paid';
import type { MercadoPagoMarkAsPaidQueueMessage } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/mercado-pago-mark-as-paid-queue.dto';
import type { ProcessPaymentDTOSchemaRequest } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';

const MERCADO_PAGO_MARK_AS_PAID_QUEUE_URL_ENV =
  'AWS_SQS_MERCADO_PAGO_MARK_AS_PAID_QUEUE_URL';

@Injectable()
export class MercadoPagoMarkAsPaidConsumer extends SqsConsumer<MercadoPagoMarkAsPaidQueueMessage> {
  constructor(
    logger: AbstractLoggerService,
    @Inject(MarkAsPaidGateway)
    private readonly markAsPaidGateway: MarkAsPaidGatewayType<ProcessPaymentDTOSchemaRequest>,
  ) {
    super(logger, MERCADO_PAGO_MARK_AS_PAID_QUEUE_URL_ENV);
  }

  async handleMessage(
    payload: MercadoPagoMarkAsPaidQueueMessage,
  ): Promise<void> {
    this.logger.log('Processing Mercado Pago mark as paid message', {
      paymentReference: payload.paymentReference,
      action: payload.webhookPayload.action,
    });

    const result = await this.markAsPaidGateway.markAsPaid(
      payload.paymentReference,
      payload.webhookPayload,
    );

    if (result.isSuccess) {
      this.logger.log('Payment marked as paid successfully', {
        paymentReference: payload.paymentReference,
      });
      return;
    }

    this.logger.error('Failed to mark payment as paid', {
      paymentReference: payload.paymentReference,
      error: result.error.message,
      errorType: result.error.constructor.name,
    });
  }
}
