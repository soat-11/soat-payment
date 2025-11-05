import { DomainPersistenceException } from '@core/domain/exceptions/domain.exception';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { executeAllOrFail } from '@core/utils/promise-utils';
import {
  CreatePaymentUseCase,
  type CreatePaymentUseCaseInput,
  type CreatePaymentUseCaseOutput,
} from '@payment/application/use-cases/create-payment/create-payment.use-case';

import { PaymentDetailEntity } from '@payment/domain/entities/payment-detail.entity';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentUnitOfWork } from '@payment/domain/repositories/payment-uow.repository';

export class CreatePaymentUseCaseImpl implements CreatePaymentUseCase {
  constructor(
    private readonly uow: PaymentUnitOfWork,
    private readonly logger: AbstractLoggerService,
  ) {}

  async execute(
    input: CreatePaymentUseCaseInput,
  ): Promise<CreatePaymentUseCaseOutput> {
    this.logger.log('Creating payment', {
      amount: input.amount,
    });
    await this.uow.start();

    try {
      this.logger.log('Creating payment entity');
      const payment = PaymentEntity.create({
        amount: input.amount,
        type: PaymentType.PIX,
      });

      this.logger.log('Creating payment detail');
      const paymentDetail = PaymentDetailEntity.createPixDetail(payment.id, {
        qrCode: input.qrCode,
      });

      payment.addPaymentDetail(paymentDetail.info);

      this.logger.log('Saving payment and payment detail');
      await executeAllOrFail([
        this.uow.paymentRepository.save(payment),
        this.uow.paymentDetailRepository.save(paymentDetail),
      ]);
      this.logger.log('Payment and payment detail saved');

      await this.uow.commit();
      this.logger.log('Payment and payment detail committed');
      payment.domainEvents.forEach((event) =>
        DomainEventDispatcherImpl.getInstance().dispatch(event),
      );
      this.logger.log('Domain events dispatched');
    } catch (error) {
      this.logger.error('Error creating payment', { error });
      await this.uow.rollback();

      if (error instanceof Error) {
        this.logger.error('Error creating payment', {
          message: error.message,
          trace: error.stack,
        });
        throw error;
      }

      this.logger.error('Error creating payment', {
        message: 'Unknown error creating payment',
        trace: 'Unknown error creating payment',
      });

      throw new DomainPersistenceException(
        'Erro desconhecido ao salvar pagamento',
      );
    }
  }
}
