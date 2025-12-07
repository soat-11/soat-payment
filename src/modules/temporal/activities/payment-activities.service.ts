import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import type { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { Inject, Injectable } from '@nestjs/common';
import {
  CancelPaymentUseCase,
  CancelPaymentUseCaseOutput,
} from '@payment/application/use-cases/cancel-payment/cancel-payment.use-case';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { ApplicationFailure } from '@temporalio/activity';

// ===== Input Types =====
export type MarkPaymentAsPaidInput = {
  paymentId: string;
};

export type CancelPaymentInput = {
  paymentId: string;
  reason: string;
};

export type NotifyPaymentCompletedInput = {
  paymentId: string;
  sessionId: string;
};

@Injectable()
export class PaymentActivitiesService {
  constructor(
    @Inject(CancelPaymentUseCase)
    private readonly cancelPaymentUseCase: CancelPaymentUseCase,
    @Inject(PaymentRepository)
    private readonly paymentRepository: PaymentRepository,
    @Inject('DomainEventDispatcher')
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly logger: AbstractLoggerService,
  ) {}

  async markPaymentAsPaid(input: MarkPaymentAsPaidInput): Promise<void> {
    this.logger.log('[Activity] Marking payment as paid', input);

    const payment = await this.paymentRepository.findById(
      UniqueEntityID.create(input.paymentId),
    );

    if (!payment) {
      this.logger.error('[Activity] Payment not found', input);
      throw ApplicationFailure.nonRetryable(
        'Payment not found',
        'PAYMENT_NOT_FOUND',
      );
    }

    const paidResult = payment.paid(new Date());
    if (paidResult.isFailure) {
      this.logger.error('[Activity] Failed to mark as paid', {
        error: paidResult.error?.message,
      });
      throw ApplicationFailure.nonRetryable(
        paidResult.error?.message || 'Failed to mark payment as paid',
        'MARK_PAID_ERROR',
      );
    }

    await this.paymentRepository.update(payment);

    for (const event of payment.domainEvents) {
      await this.eventDispatcher.dispatch(event);
    }

    this.logger.log('[Activity] Payment marked as paid', input);
  }

  async cancelPayment(
    input: CancelPaymentInput,
  ): Promise<CancelPaymentUseCaseOutput> {
    this.logger.log('[Activity] Cancelling payment', input);

    const result = await this.cancelPaymentUseCase.execute({
      paymentId: UniqueEntityID.create(input.paymentId),
    });

    if (result.isFailure) {
      this.logger.error('[Activity] Failed to cancel payment', {
        error: result.error?.message,
      });
      throw ApplicationFailure.nonRetryable(
        result.error?.message || 'Failed to cancel payment',
        'CANCEL_PAYMENT_ERROR',
      );
    }

    this.logger.log('[Activity] Payment cancelled', input);
    return result.value;
  }

  async notifyPaymentCompleted(
    input: NotifyPaymentCompletedInput,
  ): Promise<void> {
    this.logger.log('[Activity] Notifying payment completed', input);
    // TODO: Implement notification to downstream systems (e.g., order service)
    this.logger.log('[Activity] Payment completion notified', input);
  }
}
