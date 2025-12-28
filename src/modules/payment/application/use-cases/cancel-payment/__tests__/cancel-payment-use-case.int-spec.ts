import { MongoMemoryServer } from 'mongodb-memory-server';
import { DataSource } from 'typeorm';

import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { SystemDateDomainService } from '@core/domain/service/system-date.service';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { CancelPaymentUseCaseImpl } from '@payment/application/use-cases/cancel-payment/cancel-payment-impl.use-case';
import { CancelPaymentUseCase } from '@payment/application/use-cases/cancel-payment/cancel-payment.use-case';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import {
  PaymentAlreadyCanceledException,
  PaymentNotFoundException,
} from '@payment/domain/exceptions/payment.exception';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
import { PaymentMongoDBEntity } from '@payment/infra/persistence/entities/payment-mongodb.entity';
import { PixDetailMongoDBEntity } from '@payment/infra/persistence/entities/pix-detail-mongodb.entity';
import { PaymentDetailMapperFactory } from '@payment/infra/persistence/mapper/payment-detail-mapper.factory';
import { PaymentMapper } from '@payment/infra/persistence/mapper/payment.mapper';
import { PixDetailMapper } from '@payment/infra/persistence/mapper/pix-detail.mapper';
import { PaymentMongoDBRepositoryImpl } from '@payment/infra/persistence/repositories/payment-mongodb.repository';

describe('CancelPaymentUseCase - Integration Test', () => {
  let mongoServer: MongoMemoryServer;
  let dataSource: DataSource;
  let useCase: CancelPaymentUseCase;
  let paymentRepository: PaymentRepository;
  let systemDate: SystemDateDomainService;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    dataSource = new DataSource({
      type: 'mongodb',
      url: mongoUri,
      entities: [PaymentMongoDBEntity, PixDetailMongoDBEntity],
      synchronize: true,
    });

    await dataSource.initialize();

    const mongoRepository = dataSource.getMongoRepository(PaymentMongoDBEntity);

    const detailFactory = new PaymentDetailMapperFactory();

    const pixDetailRepository = dataSource.getMongoRepository(
      PixDetailMongoDBEntity,
    );

    paymentRepository = new PaymentMongoDBRepositoryImpl(
      mongoRepository,
      new PaymentMapper(detailFactory),
      detailFactory,
      new PinoLoggerService(),
    );

    detailFactory.registerMapper(new PixDetailMapper(), pixDetailRepository);
    systemDate = new SystemDateImpl();
    useCase = new CancelPaymentUseCaseImpl(
      paymentRepository,
      new PinoLoggerService(),
      systemDate,
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
    await mongoServer.stop();
  });

  describe('Success', () => {
    it('should cancel a payment', async () => {
      const now = SystemDateImpl.nowUTC();
      const mockedPayment = PaymentEntity.create({
        amount: 100,
        expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
        idempotencyKey: UniqueEntityID.create().value,
        sessionId: UniqueEntityID.create().value,
        type: PaymentType.PIX,
      })
        .addPaymentProvider({
          externalPaymentId: 'external-id-123',
          provider: PaymentProviders.MERCADO_PAGO,
        })
        .addPaymentDetail(
          PixDetailVO.create({
            qrCode: 'qr-code-123',
          }),
        );
      await paymentRepository.save(mockedPayment);

      const payments = await paymentRepository.findById(mockedPayment.id);
      expect(payments).toBeDefined();
      expect(payments?.status.value).toBe(PaymentStatus.PENDING);
      expect(payments?.canceledAt).toBeNull();

      const result = await useCase.execute({
        paymentReference: mockedPayment.paymentProvider?.value
          .externalPaymentId as string,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.canceledAt).toBeInstanceOf(Date);

      const paymentsUpdated = await paymentRepository.findById(
        mockedPayment.id,
      );

      expect(paymentsUpdated?.status.value).toBe(PaymentStatus.CANCELED);
      expect(paymentsUpdated?.canceledAt).toBeDefined();
    });
  });

  describe('Error', () => {
    it('should return error if the payment is not found', async () => {
      const result = await useCase.execute({
        paymentReference: UniqueEntityID.create().value,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentNotFoundException);
    });

    it('should return error if the payment is already canceled', async () => {
      const now = SystemDateImpl.nowUTC();
      const mockedPayment = PaymentEntity.create({
        amount: 100,
        expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
        idempotencyKey: UniqueEntityID.create().value,
        sessionId: UniqueEntityID.create().value,
        type: PaymentType.PIX,
      })
        .addPaymentProvider({
          externalPaymentId: 'external-id-456',
          provider: PaymentProviders.MERCADO_PAGO,
        })
        .addPaymentDetail(
          PixDetailVO.create({
            qrCode: 'qr-code-123',
          }),
        );
      await paymentRepository.save(mockedPayment);

      const firstResult = await useCase.execute({
        paymentReference: mockedPayment.paymentProvider?.value
          .externalPaymentId as string,
      });
      expect(firstResult.isSuccess).toBe(true);

      const secondResult = await useCase.execute({
        paymentReference: mockedPayment.paymentProvider?.value
          .externalPaymentId as string,
      });

      expect(secondResult.isFailure).toBe(true);
      expect(secondResult.error).toBeInstanceOf(
        PaymentAlreadyCanceledException,
      );
    });
  });
});
