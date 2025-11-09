import { DomainPersistenceException } from '@core/domain/exceptions/domain.exception';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';

import {
  CreatePaymentUseCase,
  type CreatePaymentUseCaseInput,
  type CreatePaymentUseCaseOutput,
} from '@payment/application/use-cases/create-payment/create-payment.use-case';

import { PaymentType } from '@payment/domain/enum/payment-type.enum';

import { PaymentFactory } from '@payment/domain/factories/payment.factory';
import { CreateQRCodeImage } from '@payment/application/use-cases/create-qrcode/create-qrcode.use-case';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';

export class CreatePaymentUseCaseImpl implements CreatePaymentUseCase {
  constructor(
    private readonly paymentFactory: PaymentFactory,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly logger: AbstractLoggerService,
    private readonly createQRCodeUseCase: CreateQRCodeImage,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(
    input: CreatePaymentUseCaseInput,
  ): Promise<CreatePaymentUseCaseOutput> {
    this.logger.log('Creating payment', {
      amount: input.amount,
    });

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

      payment.addPaymentDetail(
        PixDetailVO.create({
          qrCode: qrCode.value.image,
        }),
      );

      await this.paymentRepository.save(payment);

      this.logger.log('Payment saved', { paymentId: payment.id.value });

      payment.domainEvents.forEach((event) =>
        this.eventDispatcher.dispatch(event),
      );

      this.logger.log('Domain events dispatched');

      return {
        qrCode: qrCode.value.image,
      };
    } catch (error) {
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
