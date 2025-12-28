import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { CoreModule } from '@core/core.module';
import { HttpLoggerMiddleware } from '@core/infra/middleware/http-logger.middleware';

import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [CoreModule, PaymentModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}

