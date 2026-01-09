import { Injectable } from '@nestjs/common';

import { SqsPublish } from '@core/infra/sqs/sqs-publish';
import { CreateOrderMessage } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/create-order.dto';

@Injectable()
export class CreateOrderPublish extends SqsPublish<CreateOrderMessage> {
  protected get queueUrl(): string {
    const url = process.env['AWS_SQS_CREATE_ORDER_QUEUE_URL'];
    if (!url) {
      throw new Error('AWS_SQS_CREATE_ORDER_QUEUE_URL is not set');
    }
    return url;
  }
}
