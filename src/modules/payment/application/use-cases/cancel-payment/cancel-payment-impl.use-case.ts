import { Result } from '@core/domain/result';
import { SystemDateDomainService } from '@core/domain/service/system-date.service';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import {
  CancelPaymentUseCase,
  CancelPaymentUseCaseError,
  CancelPaymentUseCaseInput,
  CancelPaymentUseCaseOutput,
} from '@payment/application/use-cases/cancel-payment/cancel-payment.use-case';
import { PaymentNotFoundException } from '@payment/domain/exceptions/payment.exception';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';

export class CancelPaymentUseCaseImpl implements CancelPaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: AbstractLoggerService,
    private readonly systemDate: SystemDateDomainService,
  ) {}

  async execute(
    input: CancelPaymentUseCaseInput,
  ): Promise<Result<CancelPaymentUseCaseOutput, CancelPaymentUseCaseError>> {
    this.logger.log('Cancelando pagamento', {
      paymentId: input.paymentReference,
    });
    const payment = await this.paymentRepository.findByExternalPaymentId(
      input.paymentReference,
    );

    if (!payment) {
      this.logger.log('Pagamento não encontrado', {
        paymentId: input.paymentReference,
      });
      return Result.fail(new PaymentNotFoundException(input.paymentReference));
    }

    const cancelResult = payment.cancel(this.systemDate.nowUTC());

    if (cancelResult.isFailure) {
      this.logger.log('Erro ao cancelar pagamento', {
        paymentId: input.paymentReference,
        error: cancelResult.error.message,
      });
      return Result.fail(cancelResult.error);
    }

    await this.paymentRepository.update(payment);

    this.logger.log('Pagamento cancelado', {
      paymentReference: input.paymentReference,
    });

    return Result.ok({
      canceledAt: payment.canceledAt!,
    });
  }
}
