import { Module } from '@nestjs/common';
import { PaymentController } from './controllers/payment.controller';

@Module({
  controllers: [PaymentController],
})
export class PaymentPresentationModule {}
