import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsConsumer } from '@core/infra/sqs/sqs-consumer';
import { Inject, Injectable } from '@nestjs/common';
import { PaymentProcessorUseCase } from '@payment/application/use-cases/payment-processor/payment-processor.use-case';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import type { MercadoPagoProcessPaymentQueueMessage } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/mercado-pago-mark-as-paid-queue.dto';
import { MercadoPagoOrderAction } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';

const MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL_ENV =
  'AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL';

@Injectable()
export class MercadoPagoProcessPaymentConsumer extends SqsConsumer<MercadoPagoProcessPaymentQueueMessage> {
  constructor(
    logger: AbstractLoggerService,
    @Inject(PaymentProcessorUseCase)
    private readonly paymentProcessorUseCase: PaymentProcessorUseCase,
  ) {
    super(logger, MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL_ENV);
  }

  private getPaymentStatus(action: MercadoPagoOrderAction): PaymentStatus {
    switch (action) {
      case MercadoPagoOrderAction.PROCESSED:
        return PaymentStatus.PAID;
      case MercadoPagoOrderAction.REFUNDED:
        return PaymentStatus.REFUNDED;
      case MercadoPagoOrderAction.CANCELED:
        return PaymentStatus.CANCELED;
      default:
        throw new DomainBusinessException(
          `Ação de pagamento inválida: ${action}`,
        );
    }
  }

  async handleMessage(
    payload: MercadoPagoProcessPaymentQueueMessage,
  ): Promise<void> {
    this.logger.log('Processing Mercado Pago payment message', {
      paymentReference: payload.paymentReference,
      action: payload.webhookPayload?.action,
      payload: JSON.stringify(payload),
    });

    if (!payload.paymentReference) {
      this.logger.warn('Ignoring message without paymentReference', {
        payload,
      });
      return;
    }

    const action = payload.webhookPayload?.action;
    if (!action) {
      this.logger.warn('Ignoring message without action', {
        payload,
      });
      return;
    }

    try {
      await this.paymentProcessorUseCase.execute({
        paymentReference: payload.paymentReference,
        status: this.getPaymentStatus(action),
      });
    } catch (error) {
      if (error instanceof DomainBusinessException) {
        this.logger.warn('Failed to process payment', {
          error: error.message,
          payload,
        });
        return;
      }
      throw error;
    }
  }
}
