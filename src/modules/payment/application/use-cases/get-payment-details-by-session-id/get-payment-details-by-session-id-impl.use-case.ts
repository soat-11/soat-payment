import { Result } from '@core/domain/result';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import {
  GetPaymentDetailsBySessionIdUseCase,
  PaymentDetailsOutput,
} from '@payment/application/use-cases/get-payment-details-by-session-id/get-payment-details-by-session-id.use-case';
import { PaymentNotFoundException } from '@payment/domain/exceptions/payment.exception';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { SessionIdVO } from '@payment/domain/value-objects/session-id.vo';

export class GetPaymentDetailsBySessionIdUseCaseImpl
  implements GetPaymentDetailsBySessionIdUseCase
{
  constructor(
    private readonly paymentRepository: Pick<
      PaymentRepository,
      'findBySessionId'
    >,
    private readonly logger: AbstractLoggerService,
  ) {}

  async execute(sessionId: SessionIdVO): Promise<Result<PaymentDetailsOutput>> {
    this.logger.log('Get Payment Details by Session ID', {
      sessionId: sessionId.value,
    });

    const payment = await this.paymentRepository.findBySessionId(sessionId);
    if (!payment) {
      this.logger.log('Payment not found', {
        sessionId: sessionId.value,
      });
      return Result.fail(new PaymentNotFoundException(sessionId.value));
    }

    this.logger.log('Payment found', {
      paymentId: payment.id.value,
      sessionId: sessionId.value,
    });

    return Result.ok({
      id: payment.id.value,
      status: payment.status.value,
      amount: payment.amount.value,
      type: payment.type.value,
      expiresAt: payment.expiresAt,
    });
  }
}
