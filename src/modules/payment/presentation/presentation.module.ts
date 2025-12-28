import { Module } from '@nestjs/common';

import { SystemDateDomainService } from '@core/domain/service/system-date.service';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import {
  GetMethod,
  HttpClient,
  PostMethod,
} from '@core/infra/http/client/http-client';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PaymentApplicationModule } from '@payment/application/application.module';
import {
  CancelPaymentStrategy,
  MarkAsPaidStrategy,
  PaymentProcessingStrategy,
  RefundPaymentStrategy,
} from '@payment/application/strategies';
import { CancelPaymentUseCaseImpl } from '@payment/application/use-cases/cancel-payment/cancel-payment-impl.use-case';
import { CancelPaymentUseCase } from '@payment/application/use-cases/cancel-payment/cancel-payment.use-case';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { PaymentProcessorUseCaseImpl } from '@payment/application/use-cases/payment-processor/payment-processor-impl.use-case';
import { PaymentProcessorUseCase } from '@payment/application/use-cases/payment-processor/payment-processor.use-case';
import { RefundPaymentUseCaseImpl } from '@payment/application/use-cases/refund-payment/refund-payment-impl.use-case';
import { RefundPaymentUseCase } from '@payment/application/use-cases/refund-payment/refund-payment.use-case';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { CancelPaymentGateway } from '@payment/domain/gateways/cancel-payment.gateway';
import { MarkAsPaidGateway } from '@payment/domain/gateways/mark-as-paid.gateway';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { MarkAsPaidGatewayImpl } from '@payment/infra/acl/payments-gateway/mercado-pago/gateways/mark-as-paid.gateway';
import { MercadoPagoCancelPaymentGatewayImpl } from '@payment/infra/acl/payments-gateway/mercado-pago/gateways/mercado-pago-cancel-payment.gateway';
import { SqsMercadoPagoProcessPaymentPublish } from '@payment/infra/acl/payments-gateway/mercado-pago/publishers/mercado-pago-mark-as-paid.publish';
import { HMACMercadoPagoSignature } from '@payment/infra/acl/payments-gateway/mercado-pago/signature/mercado-pago-signature';
import { PaymentSignature } from '@payment/infra/acl/payments-gateway/mercado-pago/signature/payment-signature';
import { CancelPaymentConsumer } from '@payment/presentation/consumers/sqs-cancel-payment-consumer';
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
      provide: CancelPaymentUseCase,
      useFactory: (
        logger: AbstractLoggerService,
        repository: PaymentRepository,
        systemDate: SystemDateDomainService,
      ) => {
        return new CancelPaymentUseCaseImpl(repository, logger, systemDate);
      },
      inject: [
        AbstractLoggerService,
        PaymentRepository,
        SystemDateDomainService,
      ],
    },
    {
      provide: RefundPaymentUseCase,
      useFactory: (
        logger: AbstractLoggerService,
        repository: PaymentRepository,
        systemDate: SystemDateDomainService,
      ) => {
        return new RefundPaymentUseCaseImpl(repository, logger, systemDate);
      },
      inject: [
        AbstractLoggerService,
        PaymentRepository,
        SystemDateDomainService,
      ],
    },
    {
      provide: PaymentProcessorUseCase,
      useFactory: (
        logger: AbstractLoggerService,
        markAsPaidGateway: MarkAsPaidGateway,
        cancelPaymentUseCase: CancelPaymentUseCase,
        refundPaymentUseCase: RefundPaymentUseCase,
      ) => {
        const markAsPaidStrategy = new MarkAsPaidStrategy(markAsPaidGateway);
        const cancelStrategy = new CancelPaymentStrategy(cancelPaymentUseCase);
        const refundStrategy = new RefundPaymentStrategy(refundPaymentUseCase);

        const strategies = new Map<PaymentStatus, PaymentProcessingStrategy>([
          [PaymentStatus.PAID, markAsPaidStrategy],
          [PaymentStatus.CANCELED, cancelStrategy],
          [PaymentStatus.REFUNDED, refundStrategy],
        ]);

        return new PaymentProcessorUseCaseImpl(strategies, logger);
      },
      inject: [
        AbstractLoggerService,
        MarkAsPaidGateway,
        CancelPaymentUseCase,
        RefundPaymentUseCase,
      ],
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
        paymentProcessorUseCase: PaymentProcessorUseCase,
      ) => {
        return new MercadoPagoProcessPaymentConsumer(
          logger,
          paymentProcessorUseCase,
        );
      },
      inject: [AbstractLoggerService, PaymentProcessorUseCase],
    },
    {
      provide: CancelPaymentGateway,
      useFactory: (
        httpClient: GetMethod & PostMethod,
        logger: AbstractLoggerService,
      ) => {
        return new MercadoPagoCancelPaymentGatewayImpl(httpClient, logger);
      },
      inject: [HttpClient, AbstractLoggerService],
    },
    {
      provide: CancelPaymentConsumer,
      useFactory: (
        logger: AbstractLoggerService,
        cancelPaymentGateway: CancelPaymentGateway,
      ) => {
        return new CancelPaymentConsumer(logger, cancelPaymentGateway);
      },
      inject: [AbstractLoggerService, CancelPaymentGateway],
    },
  ],
})
export class PaymentPresentationModule {}
