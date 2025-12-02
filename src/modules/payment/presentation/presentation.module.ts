import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { Module } from '@nestjs/common';

import { PaymentApplicationModule } from '@payment/application/application.module';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { CreatePaymentConsumer } from '@payment/presentation/consumers/sqs-create-payment-consumer';
import { PaymentDocsController } from '@payment/presentation/controllers/payment-docs.controller';

@Module({
  imports: [PaymentApplicationModule],
  controllers: [PaymentDocsController],
  providers: [
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
  ],
})
export class PaymentPresentationModule {}
