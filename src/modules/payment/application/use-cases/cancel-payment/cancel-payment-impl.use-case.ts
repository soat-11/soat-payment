import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import {
  CancelPaymentUseCase,
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
  ): Promise<CancelPaymentUseCaseOutput> {
    this.logger.log('Cancelando pagamento', { paymentId: input.paymentId });
    const payment = await this.paymentRepository.findById(input.paymentId);

    if (!payment) {
      this.logger.log('Pagamento não encontrado', {
        paymentId: input.paymentId,
      });
      throw new PaymentNotFoundException(input.paymentId);
    }

    payment.cancel(new Date());

    await this.paymentRepository.update(payment);

    this.logger.log('Pagamento cancelado', { paymentId: input.paymentId });
  }
}
