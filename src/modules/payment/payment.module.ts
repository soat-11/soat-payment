import { Module } from '@nestjs/common';

import { CoreModule } from '@core/core.module';

import { PaymentInfraModule } from './infra/infra.module';
import { PaymentApplicationModule } from './application/application.module';
import { PaymentPresentationModule } from './presentation/presentation.module';

@Module({
  imports: [
    CoreModule,
    PaymentInfraModule,
    PaymentApplicationModule,
    PaymentPresentationModule,
  ],
})
export class PaymentModule {}
