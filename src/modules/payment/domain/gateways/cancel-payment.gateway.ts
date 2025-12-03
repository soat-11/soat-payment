import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { NotFoundException } from '@nestjs/common';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';

export interface CancelPaymentGateway {
  cancelPayment(paymentId: UniqueEntityID): Promise<void>;
}

export class CancelPaymentGatewayImpl implements CancelPaymentGateway {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly logger: AbstractLoggerService,
  ) {}

  async cancelPayment(paymentId: UniqueEntityID): Promise<void> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      this.logger.log('Payment not found', { paymentId: paymentId.toString() });
      throw new NotFoundException(`Payment ${paymentId.toString()} not found`);
    }

    this.logger.log('Payment found, cancelling', {
      paymentId: paymentId.toString(),
    });
    try {
      payment.cancel(new Date());
      this.logger.log('Payment cancelled', { paymentId: paymentId.toString() });
    } catch (error) {
      this.logger.error('Error cancelling payment', {
        error,
        paymentId: paymentId.toString(),
      });
      throw error;
    }

    await this.paymentRepository.update(payment);

    this.logger.log('Payment cancelled', { paymentId: paymentId.toString() });
  }
}
