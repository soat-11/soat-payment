import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { SqsPublish } from '@core/infra/sqs/sqs-publish';
import { MarkAsPaidGateway } from '@payment/domain/gateways/mark-as-paid.gateway';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { CreateOrderMessage } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/create-order.dto';

export class MarkAsPaidGatewayImpl implements MarkAsPaidGateway {
  constructor(
    private readonly repository: PaymentRepository,
    private readonly logger: AbstractLoggerService,
    private readonly dispatcher: DomainEventDispatcher,
    private readonly publishMercadoPagoProcessPayment: SqsPublish<CreateOrderMessage>,
  ) {}

  async markAsPaid(paymentReference: string): Promise<Result<void>> {
    if (!paymentReference || paymentReference.trim() === '') {
      this.logger.error('Invalid payment reference', {
        paymentReference,
      });
      return Result.fail(
        new DomainBusinessException('Invalid payment reference'),
      );
    }

    const payment =
      await this.repository.findByExternalPaymentId(paymentReference);
    if (!payment) {
      this.logger.error('Payment not found by external payment ID', {
        paymentReference,
      });
      return Result.fail(new DomainBusinessException('Payment not found'));
    }

    const paidResult = payment.paid(SystemDateImpl.nowUTC());
    if (paidResult.isFailure) {
      this.logger.error('Error marking payment as paid', {
        paymentReference,
        error: paidResult.error.message,
      });
      return Result.fail(paidResult.error);
    }

    await this.repository.update(payment);

    for (const event of payment.domainEvents) {
      this.logger.log('Payment marked as paid', {
        paymentReference,
        event,
      });

      await this.dispatcher.dispatch(event);
    }

    await this.publishMercadoPagoProcessPayment.publish({
      sessionId: payment.sessionId.value,
      idempotencyKey: payment.idempotencyKey.value,
    });

    return Result.ok();
  }
}
