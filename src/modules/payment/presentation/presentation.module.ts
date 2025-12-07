import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { Module } from '@nestjs/common';

import { PaymentApplicationModule } from '@payment/application/application.module';
import { MarkAsPaidGatewayImpl } from '@payment/infra/acl/payments-gateway/mercado-pago/gateways/mark-as-paid.gateway';
import { PaymentSignalAdapter } from '@payment/infra/acl/payments-gateway/mercado-pago/gateways/payment-signal.adapter';
import { MercadoPagoWebhookController } from '@payment/presentation/controllers/mercado-pago-webhook.controller';
import { TemporalModule } from '@temporal/temporal.module';

@Module({
  imports: [PaymentApplicationModule, TemporalModule],
  controllers: [MercadoPagoWebhookController],
  providers: [
    PaymentSignalAdapter,
    {
      provide: 'MarkAsPaidGateway',
      useFactory: (
        logger: AbstractLoggerService,
        signalAdapter: PaymentSignalAdapter,
      ) => {
        return new MarkAsPaidGatewayImpl(logger, signalAdapter);
      },
      inject: [AbstractLoggerService, PaymentSignalAdapter],
    },
  ],
})
export class PaymentPresentationModule {}
