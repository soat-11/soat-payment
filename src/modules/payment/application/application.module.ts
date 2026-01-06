import { Module } from '@nestjs/common';

import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import {
  PaymentFactory,
  PaymentFactoryImpl,
} from '@modules/payment/domain/factories/payment.factory';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { CreateQRCodeImage } from '@payment/application/use-cases/create-qrcode/create-qrcode.use-case';
import { CartGateway } from '@payment/domain/gateways/cart.gateway';
import { CreatePaymentGateway } from '@payment/domain/gateways/create-payment.gateway';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import {
  PaymentAmountCalculator,
  PaymentAmountCalculatorImpl,
} from '@payment/domain/service/payment-amount-calculator.service';
import { PaymentInfraModule } from '@payment/infra/infra.module';

import { CreatePaymentUseCaseImpl } from './use-cases/create-payment/create-payment-impl.use-case';
import { CreateQRCodeImageUseCaseImpl } from './use-cases/create-qrcode/create-qrcode-impl.use-case';

@Module({
  imports: [PaymentInfraModule],
  providers: [
    {
      provide: 'SystemDateDomainService',
      useFactory: () => {
        return new SystemDateImpl();
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
      provide: CreateQRCodeImage,
      useFactory: () => {
        return new CreateQRCodeImageUseCaseImpl();
      },
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
        createPaymentGateway: CreatePaymentGateway,
      ) => {
        return new CreatePaymentUseCaseImpl({
          paymentFactory: factory,
          eventDispatcher: dispatcher,
          logger,
          paymentRepository: repository,
          gateways: {
            cart: cartGateway,
            payment: createPaymentGateway,
          },
          useCases: {
            createQRCode: createQRCodeUseCase,
          },
          services: {
            amountCalculator: paymentAmountCalculator,
          },
        });
      },
      inject: [
        PaymentRepository,
        PaymentFactory,
        'DomainEventDispatcher',
        AbstractLoggerService,
        CreateQRCodeImage,
        CartGateway,
        PaymentAmountCalculator,
        CreatePaymentGateway,
      ],
    },
  ],
  exports: [
    CreatePaymentUseCase,
    'DomainEventDispatcher',
    PaymentInfraModule,
    CreateQRCodeImage,
  ],
})
export class PaymentApplicationModule {}
