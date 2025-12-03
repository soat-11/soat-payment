import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsConsumer } from '@core/infra/sqs/sqs-consumer';
import { Injectable } from '@nestjs/common';
import { CancelPaymentUseCase } from '@payment/application/use-cases/cancel-payment/cancel-payment.use-case';

@Injectable()
export class CancelPaymentConsumer extends SqsConsumer {
  constructor(
    logger: AbstractLoggerService,
    private readonly cancelPaymentUseCase: CancelPaymentUseCase,
  ) {
    super(logger, 'AWS_SQS_CANCEL_PAYMENT_QUEUE_URL');
  }

  async handleMessage(payload: any): Promise<void> {
    this.logger.log('Cancelling payment', {
      paymentId: payload.paymentId,
    });

    await this.cancelPaymentUseCase.execute({
      paymentId: UniqueEntityID.create(payload.paymentId),
    });
  }
}
