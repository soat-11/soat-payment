import { Module } from '@nestjs/common';

import { CreatePaymentUseCaseImpl } from './use-cases/create-payment/create-payment-impl.use-case';
import { CreateQRCodeImageUseCaseImpl } from './use-cases/create-qrcode/create-qrcode-impl.use-case';

import { PaymentFactoryImpl } from '../domain/factories/payment.factory';

import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';

@Module({
  providers: [
    {
      provide: 'SystemDateDomainService',
      useFactory: () => {
        return new SystemDateImpl(new Date());
      },
    },
    {
      provide: 'PaymentFactory',
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
      useFactory: (uow, factory, dispatcher, logger, createQRCodeUseCase) => {
        return new CreatePaymentUseCaseImpl(
          uow,
          factory,
          dispatcher,
          logger,
          createQRCodeUseCase,
        );
      },
      inject: [
        'PaymentUnitOfWork',
        'PaymentFactory',
        'DomainEventDispatcher',
        PinoLoggerService,
        CreateQRCodeImageUseCaseImpl,
      ],
    },
  ],
  exports: [CreatePaymentUseCase],
})
export class PaymentApplicationModule {}
