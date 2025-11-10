import { Module } from '@nestjs/common';
import { PaymentMapper } from './persistence/mapper/payment.mapper';

import { MongoModule } from '@payment/infra/persistence/datasource/mongo.module';
import { PaymentMongoDBRepositoryImpl } from '@payment/infra/persistence/repositories/payment-mongodb.repository';
import { MongoRepository } from 'typeorm';
import { PaymentMongoDBEntity } from '@payment/infra/persistence/entities/payment-mongodb.entity';
import { PixDetailMongoDBEntity } from '@payment/infra/persistence/entities/pix-detail-mongodb.entity';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PaymentDetailMapperFactory } from './persistence/mapper/payment-detail-mapper.factory';
import { PixDetailMapper } from './persistence/mapper/pix-detail.mapper';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { DefaultMongoDBEntity } from '@core/infra/database/mongodb/default-mongodb.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

@Module({
  imports: [MongoModule],
  providers: [
    {
      provide: PaymentDetailMapperFactory,
      useFactory: () => {
        const factory = new PaymentDetailMapperFactory();

        factory.registerMapper(new PixDetailMapper());
        return factory;
      },
    },
    {
      provide: PaymentMapper,
      useFactory: (detailFactory: PaymentDetailMapperFactory) => {
        return new PaymentMapper(detailFactory);
      },
      inject: [PaymentDetailMapperFactory],
    },
    {
      provide: PaymentRepository,
      useFactory: (
        paymentRepository: MongoRepository<PaymentMongoDBEntity>,
        pixDetailRepository: MongoRepository<PixDetailMongoDBEntity>,
        mapper: PaymentMapper,
        detailFactory: PaymentDetailMapperFactory,
        logger: AbstractLoggerService,
      ) => {
        const detailRepositories = new Map<
          PaymentType,
          MongoRepository<DefaultMongoDBEntity>
        >();
        detailRepositories.set(PaymentType.PIX, pixDetailRepository);

        return new PaymentMongoDBRepositoryImpl(
          paymentRepository,
          mapper,
          detailFactory,
          logger,
          detailRepositories,
        );
      },
      inject: [
        getRepositoryToken(PaymentMongoDBEntity),
        getRepositoryToken(PixDetailMongoDBEntity),
        PaymentMapper,
        PaymentDetailMapperFactory,
        AbstractLoggerService,
      ],
    },
  ],
  exports: [PaymentRepository, PaymentMapper, PaymentDetailMapperFactory],
})
export class PaymentInfraModule {}
