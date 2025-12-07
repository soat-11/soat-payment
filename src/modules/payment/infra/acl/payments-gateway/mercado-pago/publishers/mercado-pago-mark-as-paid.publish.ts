import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsPublish } from '@core/infra/sqs/sqs-publish';
import { Injectable } from '@nestjs/common';
import { MercadoPagoMarkAsPaidQueueMessage } from '../dtos/mercado-pago-mark-as-paid-queue.dto';

const MERCADO_PAGO_MARK_AS_PAID_QUEUE_URL_ENV =
  'AWS_SQS_MERCADO_PAGO_MARK_AS_PAID_QUEUE_URL';

@Injectable()
export class SqsMercadoPagoMarkAsPaidPublish extends SqsPublish<MercadoPagoMarkAsPaidQueueMessage> {
  constructor(logger: AbstractLoggerService) {
    super(logger);
  }

  protected get queueUrl(): string {
    const url = process.env[MERCADO_PAGO_MARK_AS_PAID_QUEUE_URL_ENV];
    if (!url) {
      this.logger.error('Queue URL not configured', {
        resource: this.constructor.name,
        envVar: MERCADO_PAGO_MARK_AS_PAID_QUEUE_URL_ENV,
      });
      throw new Error(
        `Queue URL not found for env var: ${MERCADO_PAGO_MARK_AS_PAID_QUEUE_URL_ENV}`,
      );
    }
    return url;
  }
}
