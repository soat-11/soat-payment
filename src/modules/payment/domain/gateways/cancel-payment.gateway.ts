import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { SystemDateDomainService } from '@core/domain/service/system-date.service';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PaymentNotFoundException } from '@payment/domain/exceptions/payment.exception';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';

export interface CancelPaymentGateway {
  cancelPayment(
    paymentReference: string,
  ): Promise<Result<void, DomainBusinessException>>;
}

export class CancelPaymentGatewayImpl implements CancelPaymentGateway {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: AbstractLoggerService,
    private readonly systemDate: SystemDateDomainService,
  ) {}

  async cancelPayment(
    paymentReference: string,
  ): Promise<Result<void, DomainBusinessException>> {
    const payment =
      await this.paymentRepository.findByExternalPaymentId(paymentReference);
    if (!payment) {
      this.logger.log('Payment not found', { paymentReference });
      return Result.fail(new PaymentNotFoundException(paymentReference));
    }
    const cancelResult = payment.cancel(this.systemDate.nowUTC());
    if (cancelResult.isFailure) {
      this.logger.error('Error cancelling payment', {
        error: cancelResult.error.message,
        paymentReference,
      });
      return Result.fail(cancelResult.error);
    }

    this.logger.log('Payment cancelled', { paymentReference });

    await this.paymentRepository.update(payment);

    this.logger.log('Payment updated', { paymentReference });

    return Result.ok();
  }
}
