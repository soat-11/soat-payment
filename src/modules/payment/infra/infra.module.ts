import { Module } from '@nestjs/common';
import { PaymentMapper } from './persistence/mapper/payment.mapper';

import { MongoModule } from '@payment/infra/persistence/datasource/mongo.module';
import { PaymentMongoDBRepositoryImpl } from '@payment/infra/persistence/repositories/payment-mongodb.repository';
import { MongoRepository } from 'typeorm';
import { PaymentMongoDBEntity } from '@payment/infra/persistence/entities/payment-mongodb.entity';
import { PixDetailMongoDBEntity } from '@payment/infra/persistence/entities/pix-detail-mongodb.entity';

import { PaymentDetailMapperFactory } from './persistence/mapper/payment-detail-mapper.factory';
import { PixDetailMapper } from './persistence/mapper/pix-detail.mapper';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { CartGateway } from '@payment/domain/gateways/cart.gateway';
import { HttpCartGateway } from './gateways/http-cart.gateway';
import { CreatePaymentGateway } from '@payment/domain/gateways/create-payment.gateway';
import { CreatePixPaymentGatewayImpl } from './acl/payments-gateway/mercado-pago/gateways/create-pix-payment.gateway';
import { HttpClient, PostMethod } from '@core/infra/http/client/http-client';

@Module({
  imports: [MongoModule],
  providers: [
    {
      provide: PaymentDetailMapperFactory,
      useFactory: (
        pixDetailRepository: MongoRepository<PixDetailMongoDBEntity>,
      ) => {
        const factory = new PaymentDetailMapperFactory();

        factory.registerMapper(new PixDetailMapper(), pixDetailRepository);
        return factory;
      },
      inject: [getRepositoryToken(PixDetailMongoDBEntity)],
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
        mapper: PaymentMapper,
        detailFactory: PaymentDetailMapperFactory,
        logger: AbstractLoggerService,
      ) => {
        return new PaymentMongoDBRepositoryImpl(
          paymentRepository,
          mapper,
          detailFactory,
          logger,
        );
      },
      inject: [
        getRepositoryToken(PaymentMongoDBEntity),
        PaymentMapper,
        PaymentDetailMapperFactory,
        AbstractLoggerService,
      ],
    },
    {
      provide: CartGateway,
      useClass: HttpCartGateway,
    },
    {
      provide: CreatePaymentGateway,
      useFactory: (
        client: PostMethod,
        logger: AbstractLoggerService,
      ) => {
        return new CreatePixPaymentGatewayImpl(client, logger);
      },
      inject: [HttpClient, AbstractLoggerService],
    },
  ],
  exports: [PaymentRepository, PaymentMapper, PaymentDetailMapperFactory, CartGateway, CreatePaymentGateway],
})
export class PaymentInfraModule {}
