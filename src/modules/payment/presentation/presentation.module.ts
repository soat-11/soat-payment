import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { Module } from '@nestjs/common';

import { PaymentApplicationModule } from '@payment/application/application.module';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { MarkAsPaidGateway } from '@payment/domain/gateways/mark-as-paid';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { MarkAsPaidGatewayImpl } from '@payment/infra/acl/payments-gateway/mercado-pago/gateways/mark-as-paid.gateway';
import { SqsMercadoPagoProcessPaymentPublish } from '@payment/infra/acl/payments-gateway/mercado-pago/publishers/mercado-pago-mark-as-paid.publish';
import { HMACMercadoPagoSignature } from '@payment/infra/acl/payments-gateway/mercado-pago/signature/mercado-pago-signature';
import { PaymentSignature } from '@payment/infra/acl/payments-gateway/mercado-pago/signature/payment-signature';
import { CreatePaymentConsumer } from '@payment/presentation/consumers/sqs-create-payment-consumer';
import { MercadoPagoProcessPaymentConsumer } from '@payment/presentation/consumers/sqs-process-payment-consumer';
import { MercadoPagoTestController } from '@payment/presentation/controllers/mercado-pago-test.controller';
import { MercadoPagoWebhookController } from '@payment/presentation/controllers/mercado-pago-webhook.controller';
import { PaymentDocsController } from '@payment/presentation/controllers/payment-docs.controller';

@Module({
  imports: [PaymentApplicationModule],
  controllers: [
    PaymentDocsController,
    MercadoPagoWebhookController,
    MercadoPagoTestController,
  ],
  providers: [
    {
      provide: PaymentSignature,
      useClass: HMACMercadoPagoSignature,
    },
    {
      provide: CreatePaymentConsumer,
      useFactory: (
        logger: AbstractLoggerService,
        createPaymentUseCase: CreatePaymentUseCase,
      ) => {
        return new CreatePaymentConsumer(logger, createPaymentUseCase);
      },
      inject: [AbstractLoggerService, CreatePaymentUseCase],
    },
    {
      provide: SqsMercadoPagoProcessPaymentPublish,
      useFactory: (logger: AbstractLoggerService) => {
        return new SqsMercadoPagoProcessPaymentPublish(logger);
      },
      inject: [AbstractLoggerService],
    },
    {
      provide: MarkAsPaidGateway,
      useFactory: (
        repository: PaymentRepository,
        logger: AbstractLoggerService,
        dispatcher: DomainEventDispatcher,
      ) => {
        return new MarkAsPaidGatewayImpl(repository, logger, dispatcher);
      },
      inject: [
        PaymentRepository,
        AbstractLoggerService,
        'DomainEventDispatcher',
      ],
    },
    {
      provide: MercadoPagoProcessPaymentConsumer,
      useFactory: (
        logger: AbstractLoggerService,
        markAsPaidGateway: MarkAsPaidGatewayImpl,
      ) => {
        return new MercadoPagoProcessPaymentConsumer(logger, markAsPaidGateway);
      },
      inject: [AbstractLoggerService, MarkAsPaidGateway],
    },
  ],
})
export class PaymentPresentationModule {}
