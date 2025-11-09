import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentPresentationModule } from './presentation/presentation.module';
import { PaymentController } from './presentation/controllers/payment.controller';

import { PaymentTypeORMEntity } from './infra/persistence/entities/payment-typeorm.entity';
import { PixDetailORMEntity } from './infra/persistence/entities/pix-detail-typeorm.entity';
import { PaymentRepositoryImpl } from './infra/persistence/repositories/payment.repository';
import { PaymentDetailRepositoryImpl } from './infra/persistence/repositories/payment-detail.repository';
import { TypeormPaymentUOW } from './infra/persistence/typeorm-payment.uow';
import { PaymentMapper } from './infra/persistence/mapper/payment.mapper';
import { PixDetailMapper } from './infra/persistence/mapper/pix-detail.mapper';

import { CreatePaymentUseCaseImpl } from './application/use-cases/create-payment/create-payment-impl.use-case';

import { PaymentFactoryImpl } from './domain/factories/payment.factory';

import { CoreModule } from '@core/core.module';
import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';

@Module({
  imports: [
    CoreModule,
    TypeOrmModule.forFeature([PaymentTypeORMEntity, PixDetailORMEntity]),
    PaymentPresentationModule,
  ],
  controllers: [PaymentController],
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
    {
      provide: 'SystemDateDomainService',
      useFactory: () => {
        return new SystemDateImpl(new Date());
      },
    },
    {
      provide: 'PaymentFactory',
      useFactory: (systemDateService) => {
        return new PaymentFactoryImpl(systemDateService);
      },
      inject: ['SystemDateDomainService'],
    },
    {
      provide: 'DomainEventDispatcher',
      useFactory: () => {
        return new DomainEventDispatcherImpl();
      },
    },
    {
      provide: CreatePaymentUseCaseImpl,
      useFactory: (uow, factory, dispatcher, logger) => {
        return new CreatePaymentUseCaseImpl(uow, factory, dispatcher, logger);
      },
      inject: [
        'PaymentUnitOfWork',
        'PaymentFactory',
        'DomainEventDispatcher',
        PinoLoggerService,
      ],
    },
  ],
  exports: [CreatePaymentUseCaseImpl],
})
export class PaymentModule {}
