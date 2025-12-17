import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { Result } from '@core/domain/result';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PaymentProcessingStrategy } from '@payment/application/strategies';
import {
  PaymentProcessorUseCase,
  PaymentProcessorUseCaseInput,
  PaymentProcessorUseCaseOutput,
} from '@payment/application/use-cases/payment-processor/payment-processor.use-case';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';

export class PaymentProcessorUseCaseImpl implements PaymentProcessorUseCase {
  constructor(
    private readonly strategies: Map<PaymentStatus, PaymentProcessingStrategy>,
    private readonly logger: AbstractLoggerService,
  ) {}

  async execute(
    input: PaymentProcessorUseCaseInput,
  ): Promise<Result<PaymentProcessorUseCaseOutput>> {
    this.logger.log('Processando pagamento', {
      paymentReference: input.paymentReference,
      status: input.status,
    });

    const strategy = this.strategies.get(input.status);

    if (!strategy) {
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

    return strategy.execute(input.paymentReference);
  }
}
