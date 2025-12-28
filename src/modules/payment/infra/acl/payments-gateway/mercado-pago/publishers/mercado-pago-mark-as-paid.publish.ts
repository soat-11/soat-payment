import { Injectable } from '@nestjs/common';

import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsPublish } from '@core/infra/sqs/sqs-publish';
import { MercadoPagoProcessPaymentQueueMessage } from '@modules/payment/infra/acl/payments-gateway/mercado-pago/dtos/mercado-pago-mark-as-paid-queue.dto';

const MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL_ENV =
  'AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL';

@Injectable()
export class SqsMercadoPagoProcessPaymentPublish extends SqsPublish<MercadoPagoProcessPaymentQueueMessage> {
  constructor(logger: AbstractLoggerService) {
    super(logger);
  }

  protected get queueUrl(): string {
    const url = process.env[MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL_ENV];
    if (!url) {
      this.logger.error('Queue URL not configured', {
        resource: this.constructor.name,
        envVar: MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL_ENV,
      });
      throw new Error(
        `Queue URL not found for env var: ${MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL_ENV}`,
      );
    }
    return url;
  }
}
