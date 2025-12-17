import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsConsumer } from '@core/infra/sqs/sqs-consumer';
import { Injectable } from '@nestjs/common';
import { CancelPaymentUseCase } from '@payment/application/use-cases/cancel-payment/cancel-payment.use-case';
import { PaymentAlreadyCanceledException } from '@payment/domain/exceptions/payment.exception';

export type CancelPaymentConsumerPayload = {
  paymentReference: string;
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
    this.logger.log('Cancelling external payment', {
      paymentReference: payload.paymentReference,
    });

    const result = await this.cancelPaymentUseCase.execute({
      paymentReference: payload.paymentReference,
    });

    if (result.isFailure) {
      if (result.error instanceof PaymentAlreadyCanceledException) {
        this.logger.log(
          'External payment already canceled, treating as success',
          {
            paymentReference: payload.paymentReference,
          },
        );
        return;
      }
      this.logger.error('Failed to cancel external payment', {
        paymentReference: payload.paymentReference,
        error: result.error.message,
      });
      throw result.error;
    }
    this.logger.log('External payment canceled', {
      paymentReference: payload.paymentReference,
    });
  }
}
