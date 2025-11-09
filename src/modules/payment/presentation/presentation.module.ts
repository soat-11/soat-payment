import { Module } from '@nestjs/common';
import { PaymentController } from './controllers/payment.controller';

import { PaymentApplicationModule } from '@payment/application/application.module';

@Module({
  imports: [PaymentApplicationModule],
  controllers: [PaymentController],
})
export class PaymentPresentationModule {}
