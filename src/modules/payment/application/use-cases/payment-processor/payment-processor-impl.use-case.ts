import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { CancelPaymentUseCase } from '@payment/application/use-cases/cancel-payment/cancel-payment.use-case';
import {
  PaymentProcessorUseCase,
  PaymentProcessorUseCaseInput,
  PaymentProcessorUseCaseOutput,
} from '@payment/application/use-cases/payment-processor/payment-processor.use-case';
import { RefundPaymentUseCase } from '@payment/application/use-cases/refund-payment/refund-payment.use-case';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { MarkAsPaidGateway } from '@payment/domain/gateways/mark-as-paid';

export class PaymentProcessorUseCaseImpl implements PaymentProcessorUseCase {
  constructor(
    private readonly markAsPaidGateway: MarkAsPaidGateway,
    private readonly cancelPaymentGateway: CancelPaymentUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
    private readonly logger: AbstractLoggerService,
  ) {}
  async execute(
    input: PaymentProcessorUseCaseInput,
  ): Promise<Result<PaymentProcessorUseCaseOutput>> {
    this.logger.log('Processando pagamento', {
      paymentReference: input.paymentReference,
      status: input.status,
    });

    if (input.status === PaymentStatus.PAID) {
      return this.markAsPaidGateway.markAsPaid(input.paymentReference);
    }

    if (input.status === PaymentStatus.CANCELED) {
      const result = await this.cancelPaymentGateway.execute({
        paymentReference: input.paymentReference,
      });

      if (result.isFailure) {
        return Result.fail(result.error);
      }

      return Result.ok();
    }

    if (input.status === PaymentStatus.REFUNDED) {
      const result = await this.refundPaymentUseCase.execute({
        paymentReference: input.paymentReference,
      });

      if (result.isFailure) {
        return Result.fail(result.error);
      }
      return Result.ok();
    }

    this.logger.log(
      'Status de pagamento inválido, não é possível processar o pagamento',
      {
        paymentReference: input.paymentReference,
        status: input.status,
      },
    );

    return Result.fail(
      new DomainBusinessException(
        'Status de pagamento inválido, não é possível processar o pagamento',
      ),
    );
  }
}
