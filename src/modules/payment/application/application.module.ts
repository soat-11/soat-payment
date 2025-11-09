import { Module } from '@nestjs/common';

import { CreatePaymentUseCaseImpl } from './use-cases/create-payment/create-payment-impl.use-case';
import { CreateQRCodeImageUseCaseImpl } from './use-cases/create-qrcode/create-qrcode-impl.use-case';

import {
  PaymentFactory,
  PaymentFactoryImpl,
} from '../domain/factories/payment.factory';

import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { CreateQRCodeImage } from '@payment/application/use-cases/create-qrcode/create-qrcode.use-case';
import { PaymentInfraModule } from '@payment/infra/infra.module';

@Module({
  imports: [PaymentInfraModule],
  providers: [
    {
      provide: 'SystemDateDomainService',
      useFactory: () => {
        return new SystemDateImpl(new Date());
      },
    },
    {
      provide: PaymentFactory,
      useFactory: (systemDateService) => {
        return new PaymentFactoryImpl(systemDateService);
      },
      inject: ['SystemDateDomainService'],
    },
    {
      provide: 'DomainEventDispatcher',
      useFactory: () => {
        return new DomainEventDispatcherImpl();
      },
    },
    {
      provide: CreateQRCodeImageUseCaseImpl,
      useClass: CreateQRCodeImageUseCaseImpl,
    },
    {
      provide: CreatePaymentUseCase,
      useFactory: (
        repository: PaymentRepository,
        factory: PaymentFactory,
        dispatcher: DomainEventDispatcher,
        logger: AbstractLoggerService,
        createQRCodeUseCase: CreateQRCodeImage,
      ) => {
        return new CreatePaymentUseCaseImpl(
          factory,
          dispatcher,
          logger,
          createQRCodeUseCase,
          repository,
        );
      },
      inject: [
        PaymentRepository,
        PaymentFactory,
        'DomainEventDispatcher',
        AbstractLoggerService,
        CreateQRCodeImageUseCaseImpl,
      ],
    },
  ],
  exports: [CreatePaymentUseCase],
})
export class PaymentApplicationModule {}
