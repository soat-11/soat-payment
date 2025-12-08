import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
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
  ) {}

  async execute(
    input: CancelPaymentUseCaseInput,
  ): Promise<Result<CancelPaymentUseCaseOutput, CancelPaymentUseCaseError>> {
    this.logger.log('Cancelando pagamento', { paymentId: input.paymentId });
    const payment = await this.paymentRepository.findById(input.paymentId);

    if (!payment) {
      this.logger.log('Pagamento não encontrado', {
        paymentId: input.paymentId,
      });
      return Result.fail(new PaymentNotFoundException(input.paymentId));
    }

    const cancelResult = payment.cancel(SystemDateImpl.nowUTC());

    if (cancelResult.isFailure) {
      this.logger.log('Erro ao cancelar pagamento', {
        paymentId: input.paymentId,
        error: cancelResult.error.message,
      });
      return Result.fail(cancelResult.error);
    }

    await this.paymentRepository.update(payment);

    this.logger.log('Pagamento cancelado', { paymentId: input.paymentId });

    return Result.ok({
      canceledAt: payment.canceledAt!,
    });
  }
}
