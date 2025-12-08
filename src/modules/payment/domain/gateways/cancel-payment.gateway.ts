import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PaymentNotFoundException } from '@payment/domain/exceptions/payment.exception';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';

export interface CancelPaymentGateway {
  cancelPayment(
    paymentId: UniqueEntityID,
  ): Promise<Result<void, DomainBusinessException>>;
}

export class CancelPaymentGatewayImpl implements CancelPaymentGateway {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: AbstractLoggerService,
  ) {}

  async cancelPayment(
    paymentId: UniqueEntityID,
  ): Promise<Result<void, DomainBusinessException>> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.log('Payment not found', { paymentId: paymentId.toString() });
      return Result.fail(new PaymentNotFoundException(paymentId));
    }

    this.logger.log('Payment found, cancelling', {
      paymentId: paymentId.toString(),
    });

    const cancelResult = payment.cancel(SystemDateImpl.nowUTC());
    if (cancelResult.isFailure) {
      this.logger.error('Error cancelling payment', {
        error: cancelResult.error.message,
        paymentId: paymentId.toString(),
      });
      return Result.fail(cancelResult.error);
    }

    this.logger.log('Payment cancelled', { paymentId: paymentId.toString() });

    await this.paymentRepository.update(payment);

    this.logger.log('Payment updated', { paymentId: paymentId.toString() });

    return Result.ok();
  }
}
