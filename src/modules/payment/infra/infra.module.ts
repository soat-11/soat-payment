import { Module } from '@nestjs/common';
import { PaymentMapper } from './persistence/mapper/payment.mapper';

import { PinoLoggerService } from '@core/infra/logger/pino-logger';

import { PaymentMongoDBRepositoryImpl } from '@payment/infra/persistence/repositories/payment-mongodb.repository';
import { MongoRepository } from 'typeorm';
import { PaymentMongoDBEntity } from '@payment/infra/persistence/entities/payment-mongodb.entity';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { MongoModule } from '@payment/infra/persistence/datasource/mongo.module';

@Module({
  imports: [MongoModule],
  providers: [
    PaymentMapper,

    {
      provide: 'PaymentRepository',
      useFactory: (
        mongoRepository: MongoRepository<PaymentMongoDBEntity>,
        mapper: PaymentMapper,
        logger: AbstractLoggerService,
      ) => {
        return new PaymentMongoDBRepositoryImpl(
          mongoRepository,
          mapper,
          logger,
        );
      },
      inject: [
        MongoRepository<PaymentMongoDBEntity>,
        PaymentMapper,
        PinoLoggerService,
      ],
    },
  ],
  exports: [
    'PaymentRepository',
    'PaymentDetailRepository',
    'PaymentUnitOfWork',
    PaymentMapper,
  ],
})
export class PaymentInfraModule {}
