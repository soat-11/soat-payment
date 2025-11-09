import { DomainPersistenceException } from '@core/domain/exceptions/domain.exception';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { executeAllOrFail } from '@core/utils/promise-utils';
import {
  CreatePaymentUseCase,
  type CreatePaymentUseCaseInput,
  type CreatePaymentUseCaseOutput,
} from '@payment/application/use-cases/create-payment/create-payment.use-case';

import { PaymentDetailEntity } from '@payment/domain/entities/payment-detail.entity';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentUnitOfWork } from '@payment/domain/repositories/payment-uow.repository';
import { PaymentFactory } from '@payment/domain/factories/payment.factory';
import { CreateQRCodeImage } from '@payment/application/use-cases/create-qrcode/create-qrcode.use-case';

export class CreatePaymentUseCaseImpl implements CreatePaymentUseCase {
  constructor(
    private readonly uow: PaymentUnitOfWork,
    private readonly paymentFactory: PaymentFactory,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly logger: AbstractLoggerService,
    private readonly createQRCodeUseCase: CreateQRCodeImage,
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

      const payment = this.paymentFactory.create({
        amount: input.amount,
        type: PaymentType.PIX,
      });

      this.logger.log('Creating QR Code', { paymentId: payment.id.value });

      const qrCode = await this.createQRCodeUseCase.execute({
        qrData: payment.id.value,
      });

      if (qrCode.isFailure) {
        this.logger.error('Error creating QR Code', { error: qrCode.error });
        throw qrCode.error;
      }

      this.logger.log('Creating payment detail');

      const paymentDetail = PaymentDetailEntity.createPixDetail(payment.id, {
        qrCode: qrCode.value.image,
      });

      payment.addPaymentDetail(paymentDetail.info);

      this.logger.log('Saving payment and payment detail');

      await executeAllOrFail([
        this.uow.paymentRepository.save(payment),
        this.uow.paymentDetailRepository.save(paymentDetail),
      ]);

      await this.uow.commit();

      this.logger.log('Payment and payment detail committed');

      payment.domainEvents.forEach((event) =>
        this.eventDispatcher.dispatch(event),
      );

      this.logger.log('Domain events dispatched');

      return {
        qrCode: qrCode.value.image,
      };
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
