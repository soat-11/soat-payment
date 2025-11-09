import { Module } from '@nestjs/common';
import { PaymentRepositoryImpl } from './persistence/repositories/payment.repository';
import { PaymentDetailRepositoryImpl } from './persistence/repositories/payment-detail.repository';
import { TypeormPaymentUOW } from './persistence/typeorm-payment.uow';
import { PaymentMapper } from './persistence/mapper/payment.mapper';
import { PixDetailMapper } from './persistence/mapper/pix-detail.mapper';

import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { MongoModule } from '@payment/infra/persistence/datasource/mongo.module';

@Module({
  imports: [MongoModule],
  providers: [
    PaymentMapper,
    PixDetailMapper,
    {
      provide: 'PaymentRepository',
      useFactory: (dataSource, mapper, logger) => {
        return new PaymentRepositoryImpl(dataSource, mapper, logger);
      },
      inject: ['DataSource', PaymentMapper, PinoLoggerService],
    },
    {
      provide: 'PaymentDetailRepository',
      useFactory: (dataSource, mapper, logger) => {
        return new PaymentDetailRepositoryImpl(dataSource, mapper, logger);
      },
      inject: ['DataSource', PixDetailMapper, PinoLoggerService],
    },
    {
      provide: 'PaymentUnitOfWork',
      useFactory: (dataSource, paymentRepo, detailRepo, logger) => {
        return new TypeormPaymentUOW(
          dataSource,
          paymentRepo,
          detailRepo,
          logger,
        );
      },
      inject: [
        'DataSource',
        'PaymentRepository',
        'PaymentDetailRepository',
        PinoLoggerService,
      ],
    },
  ],
  exports: [
    'PaymentRepository',
    'PaymentDetailRepository',
    'PaymentUnitOfWork',
    PaymentMapper,
    PixDetailMapper,
  ],
})
export class PaymentInfraModule {}
