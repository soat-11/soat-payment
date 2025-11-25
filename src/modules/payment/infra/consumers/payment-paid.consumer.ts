import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsConsumer } from '@core/infra/sqs/sqs-consumer';
import { Injectable } from '@nestjs/common';
import { PaymentPaidEvent } from '@payment/domain/events/payment-paid.event';

@Injectable()
export class PaymentPaidConsumer extends SqsConsumer {
  constructor(logger: AbstractLoggerService) {
    super(logger, 'AWS_SQS_PAYMENT_PAID_QUEUE_URL');
  }

  async handleMessage(message: any): Promise<void> {
    if (message.eventName === PaymentPaidEvent.name) {
      this.logger.log('Processing PaymentPaid event', {
        paymentId: message.data.id,
        occurredAt: message.dateTimeOccurred,
      });
    } else {
      this.logger.warn('Received unexpected event', {
        eventName: message.eventName,
      });
    }
  }
}
