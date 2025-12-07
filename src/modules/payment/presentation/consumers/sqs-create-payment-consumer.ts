import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsConsumer } from '@core/infra/sqs/sqs-consumer';
import { Injectable } from '@nestjs/common';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { CreatePaymentDto } from '@payment/presentation/dto/request/create-payment.dto';

@Injectable()
export class CreatePaymentConsumer extends SqsConsumer<CreatePaymentDto> {
  constructor(
    logger: AbstractLoggerService,
    private readonly createPaymentUseCase: CreatePaymentUseCase,
  ) {
    super(logger, 'AWS_SQS_CREATE_PAYMENT_QUEUE_URL');
  }

  async handleMessage(payload: CreatePaymentDto): Promise<void> {
    this.logger.log('Creating payment', {
      sessionId: payload.sessionId,
      idempotencyKey: payload.idempotencyKey,
    });

    const result = await this.createPaymentUseCase.execute({
      sessionId: payload.sessionId,
      idempotencyKey: payload.idempotencyKey,
    });

    if (result.isSuccess) {
      this.logger.log('Payment created', {
        paymentId: result.value.paymentId,
      });
      return;
    }

    this.logger.error('Failed to create payment (no retry)', {
      error: result.error.message,
      errorType: result.error.constructor.name,
      idempotencyKey: payload.idempotencyKey,
    });

    return;
  }
}
