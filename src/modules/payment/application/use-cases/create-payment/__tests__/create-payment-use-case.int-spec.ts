import { DataSource, MongoRepository } from 'typeorm';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { CreatePaymentUseCaseImpl } from '@payment/application/use-cases/create-payment/create-payment-impl.use-case';

import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentMapper } from '@payment/infra/persistence/mapper/payment.mapper';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import {
  CreatePaymentUseCase,
  CreatePaymentUseCaseInput,
} from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { PaymentFactoryImpl } from '@payment/domain/factories/payment.factory';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';
import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { CreateQRCodeImageUseCaseImpl } from '@payment/application/use-cases/create-qrcode/create-qrcode-impl.use-case';
import { CreateQRCodeImage } from '@payment/application/use-cases/create-qrcode/create-qrcode.use-case';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PaymentMongoDBRepositoryImpl } from '@payment/infra/persistence/repositories/payment-mongodb.repository';
import { PaymentMongoDBEntity } from '@payment/infra/persistence/entities/payment-mongodb.entity';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentDetailMapperFactory } from '@payment/infra/persistence/mapper/payment-detail-mapper.factory';

describe('CreatePaymentUseCase - Integration Test', () => {
  let mongoServer: MongoMemoryServer;
  let dataSource: DataSource;
  let useCase: CreatePaymentUseCase;
  let paymentRepository: PaymentRepository;
  let mongoRepository: MongoRepository<PaymentMongoDBEntity>;
  let createQRCodeUseCase: CreateQRCodeImage;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    dataSource = new DataSource({
      type: 'mongodb',
      url: mongoUri,
      entities: [PaymentMongoDBEntity],
      synchronize: true,
    });

    await dataSource.initialize();

    mongoRepository = dataSource.getMongoRepository(PaymentMongoDBEntity);

    paymentRepository = new PaymentMongoDBRepositoryImpl(
      mongoRepository,
      new PaymentMapper(),
      new PaymentDetailMapperFactory(),
      new PinoLoggerService(),
    );
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await mongoRepository.clear();
      await dataSource.destroy();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await mongoRepository.clear();

    createQRCodeUseCase = new CreateQRCodeImageUseCaseImpl();

    useCase = new CreatePaymentUseCaseImpl(
      new PaymentFactoryImpl(new SystemDateImpl(new Date())),
      new DomainEventDispatcherImpl(),
      new PinoLoggerService(),
      createQRCodeUseCase,
      paymentRepository,
    );
  });

  describe('Success', () => {
    it('should create a payment and save to database', async () => {
      const input: CreatePaymentUseCaseInput = {
        amount: 100,
      };

      await useCase.execute(input);

      const payments = await mongoRepository.find();

      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(100);
      expect(payments[0].type).toBe(PaymentType.PIX);
      expect(payments[0].status).toBe(PaymentStatus.PENDING);
      expect(payments[0].id).toBeDefined();
      expect(payments[0]._id).toBeDefined();
    });

    it('should create a payment with domain ID preserved', async () => {
      const input: CreatePaymentUseCaseInput = {
        amount: 100,
      };

      const result = await useCase.execute(input);

      const payments = await mongoRepository.find();
      const payment = payments[0];

      expect(payment).toBeDefined();
      expect(payment.id).toBeDefined();
      expect(payment.amount).toBe(100);
      expect(result.qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('Validation', () => {
    it('should reject invalid amount (negative)', async () => {
      const input: CreatePaymentUseCaseInput = {
        amount: -100,
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        DomainBusinessException,
      );

      const payments = await mongoRepository.find();
      expect(payments).toHaveLength(0);
    });

    it('should reject invalid amount (zero)', async () => {
      const input: CreatePaymentUseCaseInput = {
        amount: 0,
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        DomainBusinessException,
      );

      const payments = await mongoRepository.find();
      expect(payments).toHaveLength(0);
    });
  });

  describe('Repository Integration', () => {
    it('should find payment by domain ID', async () => {
      const input: CreatePaymentUseCaseInput = {
        amount: 200,
      };

      await useCase.execute(input);

      const payments = await mongoRepository.find();
      expect(payments).toHaveLength(1);

      const payment = payments[0];
      const foundPayment = await paymentRepository.findById(payment.id);

      expect(foundPayment).toBeDefined();
      expect(foundPayment!.id.value).toBe(payment.id.value);
      expect(foundPayment!.amount.value).toBe(200);
      expect(foundPayment!.status.value).toBe(PaymentStatus.PENDING);
    });

    it('should return null for non-existent payment', async () => {
      const fakeId = UniqueEntityID.create();

      const foundPayment = await paymentRepository.findById(fakeId);

      expect(foundPayment).toBeNull();
    });
  });
});
