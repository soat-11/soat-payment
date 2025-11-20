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


import { PaymentInfraModule } from '@payment/infra/infra.module';
import {
  PaymentAmountCalculator,
  PaymentAmountCalculatorImpl,
} from '@payment/domain/service/payment-amount-calculator.service';
import { CartGateway } from '@payment/domain/gateways/cart.gateway';
import { CreateQRCodeImage } from '@payment/application/use-cases/create-qrcode/create-qrcode.use-case';

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
      provide: PaymentAmountCalculator,
      useClass: PaymentAmountCalculatorImpl,
    },
    {
      provide: CreatePaymentUseCase,
      useFactory: (
        repository: PaymentRepository,
        factory: PaymentFactory,
        dispatcher: DomainEventDispatcher,
        logger: AbstractLoggerService,
        createQRCodeUseCase: CreateQRCodeImage,
        cartGateway: CartGateway,
        paymentAmountCalculator: PaymentAmountCalculator,
      ) => {
        return new CreatePaymentUseCaseImpl(
          factory,
          dispatcher,
          logger,
          createQRCodeUseCase,
          repository,
          cartGateway,
          paymentAmountCalculator,
        );
      },
      inject: [
        PaymentRepository,
        PaymentFactory,
        'DomainEventDispatcher',
        AbstractLoggerService,
        CreateQRCodeImageUseCaseImpl,
        CartGateway,
        PaymentAmountCalculator,
      ],
    },
  ],
  exports: [CreatePaymentUseCase],
})
export class PaymentApplicationModule {}
