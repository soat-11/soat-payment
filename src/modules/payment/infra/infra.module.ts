import { Module } from '@nestjs/common';
import { PaymentMapper } from './persistence/mapper/payment.mapper';
import { PaymentMongoDBRepositoryImpl } from '@payment/infra/persistence/repositories/payment-mongodb.repository';
import { MongoRepository } from 'typeorm';
import { PaymentMongoDBEntity } from '@payment/infra/persistence/entities/payment-mongodb.entity';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { MongoModule } from '@payment/infra/persistence/datasource/mongo.module';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [MongoModule, TypeOrmModule.forFeature([PaymentMongoDBEntity])],
  providers: [
    PaymentMapper,
    {
      provide: PaymentRepository,
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
        getRepositoryToken(PaymentMongoDBEntity),
        PaymentMapper,
        AbstractLoggerService,
      ],
    },
  ],
  exports: [PaymentRepository, PaymentMapper],
})
export class PaymentInfraModule {}
