import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsConsumer } from '@core/infra/sqs/sqs-consumer';
import { Injectable } from '@nestjs/common';
import { CancelPaymentUseCase } from '@payment/application/use-cases/cancel-payment/cancel-payment.use-case';
import { PaymentAlreadyCanceledException } from '@payment/domain/exceptions/payment.exception';

export type CancelPaymentConsumerPayload = {
  paymentId: string;
};

@Injectable()
export class CancelPaymentConsumer extends SqsConsumer<CancelPaymentConsumerPayload> {
  constructor(
    logger: AbstractLoggerService,
    private readonly cancelPaymentUseCase: CancelPaymentUseCase,
  ) {
    super(logger, 'AWS_SQS_CANCEL_PAYMENT_QUEUE_URL');
  }

  async handleMessage(payload: CancelPaymentConsumerPayload): Promise<void> {
    this.logger.log('Cancelling payment', {
      paymentId: payload.paymentId,
    });

    const result = await this.cancelPaymentUseCase.execute({
      paymentId: UniqueEntityID.create(payload.paymentId),
    });

    if (result.isFailure) {
      if (result.error instanceof PaymentAlreadyCanceledException) {
        this.logger.log('Payment already canceled, treating as success', {
          paymentId: payload.paymentId,
        });
        return;
      }

      this.logger.error('Failed to cancel payment', {
        error: result.error.message,
        paymentId: payload.paymentId,
      });
      throw result.error;
    }

    this.logger.log('Payment canceled', {
      paymentId: payload.paymentId,
      canceledAt: result.value.canceledAt,
    });
  }
}
