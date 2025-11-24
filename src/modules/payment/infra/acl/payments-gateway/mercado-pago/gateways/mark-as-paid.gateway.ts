import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { MarkAsPaidGateway } from '@payment/domain/gateways/mark-as-paid';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';
import { ProcessPaymentDTOSchemaRequest } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';

export class MarkAsPaidGatewayImpl
  implements MarkAsPaidGateway<ProcessPaymentDTOSchemaRequest>
{
  constructor(
    private readonly repository: PaymentRepository,
    private readonly logger: AbstractLoggerService,
    private readonly dispatcher: DomainEventDispatcher,
  ) {}

  async markAsPaid(
    paymentReference: string,
    body: ProcessPaymentDTOSchemaRequest,
  ): Promise<Result<void>> {
    try {
      if (body.action !== 'payment.created') {
        this.logger.error('Invalid action', {
          action: body.action,
          paymentReference,
        });
        return Result.fail(new DomainBusinessException('Invalid action'));
      }

      const idempotencyKey = IdempotencyKeyVO.create(paymentReference);

      if (!idempotencyKey) {
        this.logger.error('Invalid idempotency key', {
          paymentReference,
        });
        return Result.fail(
          new DomainBusinessException('Invalid idempotency key'),
        );
      }

      const payment =
        await this.repository.findByIdempotencyKey(idempotencyKey);
      if (!payment) {
        this.logger.error('Payment not found', {
          paymentReference,
        });
        return Result.fail(new DomainBusinessException('Payment not found'));
      }

      payment.paid(new Date());

      await this.repository.update(payment);

      payment.domainEvents.forEach((event) => {
        this.logger.log('Payment marked as paid', {
          paymentReference,
          event,
        });

        this.dispatcher.dispatch(event);
      });

      return Result.ok();
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error('Error marking payment as paid', {
          message: e.message,
          trace: e.stack,
        });
        return Result.fail(
          new DomainBusinessException('Error marking payment as paid'),
        );
      }

      return Result.fail(
        new DomainBusinessException('Error marking payment as paid'),
      );
    }
  }
}
