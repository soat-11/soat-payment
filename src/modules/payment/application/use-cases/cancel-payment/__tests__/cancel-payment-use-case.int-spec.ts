import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { CancelPaymentUseCaseImpl } from '@payment/application/use-cases/cancel-payment/cancel-payment-impl.use-case';
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
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DataSource } from 'typeorm';
import { CancelPaymentUseCase } from '@payment/application/use-cases/cancel-payment/cancel-payment.use-case';

describe('CancelPaymentUseCase - Integration Test', () => {
  let mongoServer: MongoMemoryServer;
  let dataSource: DataSource;
  let useCase: CancelPaymentUseCase;
  let paymentRepository: PaymentRepository;

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
    useCase = new CancelPaymentUseCaseImpl(
      paymentRepository,
      new PinoLoggerService(),
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
    await mongoServer.stop();
  });

  describe('Success', () => {
    it('should cancel a payment', async () => {
      const mockedPayment = PaymentEntity.create({
        amount: 100,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
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
        paymentId: mockedPayment.id,
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
        paymentId: UniqueEntityID.create(),
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentNotFoundException);
    });

    it('should return error if the payment is already canceled', async () => {
      const mockedPayment = PaymentEntity.create({
        amount: 100,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
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

      const firstResult = await useCase.execute({
        paymentId: mockedPayment.id,
      });
      expect(firstResult.isSuccess).toBe(true);

      const secondResult = await useCase.execute({
        paymentId: mockedPayment.id,
      });

      expect(secondResult.isFailure).toBe(true);
      expect(secondResult.error).toBeInstanceOf(PaymentAlreadyCanceledException);
    });
  });
});
