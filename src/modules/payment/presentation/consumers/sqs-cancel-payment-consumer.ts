import { Inject, Injectable } from '@nestjs/common';

import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsConsumer } from '@core/infra/sqs/sqs-consumer';
import { CancelPaymentGateway } from '@payment/domain/gateways/cancel-payment.gateway';

export type CancelPaymentConsumerPayload = {
  orderId: string;
};

@Injectable()
export class CancelPaymentConsumer extends SqsConsumer<CancelPaymentConsumerPayload> {
  constructor(
    logger: AbstractLoggerService,
    @Inject(CancelPaymentGateway)
    private readonly cancelPaymentGateway: CancelPaymentGateway,
  ) {
    super(logger, 'AWS_SQS_CANCEL_PAYMENT_QUEUE_URL');
  }

  protected get dlqUrl(): string | null {
    return process.env.AWS_SQS_CANCEL_PAYMENT_DLQ_URL || null;
  }

  async handleMessage(payload: CancelPaymentConsumerPayload): Promise<void> {
    this.logger.log('Iniciando cancelamento de order no Mercado Pago', {
      orderId: payload.orderId,
    });

    const result = await this.cancelPaymentGateway.cancelPayment(
      payload.orderId,
    );

    if (result.isFailure) {
      this.logger.error('Falha ao cancelar order no Mercado Pago', {
        orderId: payload.orderId,
        error: result.error.message,
      });
      throw result.error;
    }

    this.logger.log('Order cancelada com sucesso no Mercado Pago', {
      orderId: payload.orderId,
    });
  }
}
