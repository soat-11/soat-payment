import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsConsumer } from '@core/infra/sqs/sqs-consumer';
import { Injectable } from '@nestjs/common';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { PaymentAlreadyExistsException } from '@payment/domain/exceptions/payment.exception';
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

    if (result.isFailure) {
      if (result.error instanceof PaymentAlreadyExistsException) {
        this.logger.log('Payment already exists, treating as success', {
          idempotencyKey: payload.idempotencyKey,
        });
        return;
      }

      this.logger.error('Failed to create payment', {
        error: result.error.message,
        idempotencyKey: payload.idempotencyKey,
      });
      throw result.error;
    }

    this.logger.log('Payment created', {
      paymentId: result.value.paymentId,
    });
  }
}
