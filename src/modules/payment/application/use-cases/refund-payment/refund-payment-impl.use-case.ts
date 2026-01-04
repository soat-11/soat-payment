import { Result } from '@core/domain/result';
import { SystemDateDomainService } from '@core/domain/service/system-date.service';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import {
  RefundPaymentUseCase,
  RefundPaymentUseCaseInput,
  RefundPaymentUseCaseOutput,
} from '@payment/application/use-cases/refund-payment/refund-payment.use-case';
import { PaymentNotFoundException } from '@payment/domain/exceptions/payment.exception';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';

export class RefundPaymentUseCaseImpl implements RefundPaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: AbstractLoggerService,
    private readonly systemDate: SystemDateDomainService,
  ) {}

  async execute(
    input: RefundPaymentUseCaseInput,
  ): Promise<Result<RefundPaymentUseCaseOutput>> {
    this.logger.log('Reembolsando pagamento', {
      paymentReference: input.paymentReference,
    });
    const payment = await this.paymentRepository.findByExternalPaymentId(
      input.paymentReference,
    );
    if (!payment) {
      this.logger.log('Pagamento não encontrado', {
        paymentReference: input.paymentReference,
      });
      return Result.fail(new PaymentNotFoundException(input.paymentReference));
    }

    const refundResult = payment.refund(this.systemDate.nowUTC());
    if (refundResult.isFailure) {
      this.logger.log('Erro ao reembolsar pagamento', {
        paymentReference: input.paymentReference,
        error: refundResult.error.message,
      });
      return Result.fail(refundResult.error);
    }

    await this.paymentRepository.update(payment);

    this.logger.log('Pagamento reembolsado', {
      paymentReference: input.paymentReference,
    });

    return Result.ok({
      refundedAt: payment.refundedAt!,
    });
  }
}
