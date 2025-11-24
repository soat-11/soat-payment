import { DataSource, MongoRepository } from 'typeorm';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { CreatePaymentUseCaseImpl } from '@payment/application/use-cases/create-payment/create-payment-impl.use-case';

import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentMapper } from '@payment/infra/persistence/mapper/payment.mapper';

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

import { PaymentDetailMapperFactory } from '@payment/infra/persistence/mapper/payment-detail-mapper.factory';
import { PixDetailMongoDBEntity } from '@payment/infra/persistence/entities/pix-detail-mongodb.entity';
import { PixDetailMapper } from '@payment/infra/persistence/mapper/pix-detail.mapper';
import { faker } from '@faker-js/faker';
import { DomainConflictException } from '@core/domain/exceptions/domain.exception';
import { CartGateway } from '@payment/domain/gateways/cart.gateway';
import { PaymentAmountCalculatorImpl } from '@payment/domain/service/payment-amount-calculator.service';
import { CreatePaymentGateway } from '@payment/domain/gateways/create-payment.gateway';
import { Result } from '@core/domain/result';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { PaymentCreatedEvent } from '@payment/domain/events/payment-created.event';

describe('CreatePaymentUseCase - Integration Test', () => {
  let mongoServer: MongoMemoryServer;
  let dataSource: DataSource;
  let useCase: CreatePaymentUseCase;
  let paymentRepository: PaymentRepository;

 let mongoRepository: MongoRepository<PaymentMongoDBEntity>;
  let createQRCodeUseCase: CreateQRCodeImage;
  let cartGateway: CartGateway;
  let paymentAmountCalculator: PaymentAmountCalculatorImpl;
  let createPaymentGateway: CreatePaymentGateway;
  let domainEventDispatcher: DomainEventDispatcher

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    dataSource = new DataSource({
      type: 'mongodb',
      url: mongoUri,
      entities: [PaymentMongoDBEntity, PixDetailMongoDBEntity],
      synchronize: true,
    });

    await dataSource.initialize();

    mongoRepository = dataSource.getMongoRepository(PaymentMongoDBEntity);

    const detailFactory = new PaymentDetailMapperFactory();

    const pixDetailRepository = dataSource.getMongoRepository(
      PixDetailMongoDBEntity,
    );

    detailFactory.registerMapper(new PixDetailMapper(), pixDetailRepository);

    paymentRepository = new PaymentMongoDBRepositoryImpl(
      mongoRepository,
      new PaymentMapper(detailFactory),
      detailFactory,
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
    paymentAmountCalculator = new PaymentAmountCalculatorImpl();
    domainEventDispatcher = new DomainEventDispatcherImpl()
    cartGateway = {
      async getCart(sessionId: string) {
        return Promise.resolve({
          items: [
            {
              sku: '123',
              quantity: 2,
              unitPrice: 100,
            },
            {
              sku: '456',
              quantity: 1,
              unitPrice: 50,
            }
          ]
        })
      },
    };

    createPaymentGateway = {
      async createPayment(payment) {
        return Promise.resolve(Result.ok({
          qrCode: 'qrCode-teste',
        }))
      },
    };

    useCase = new CreatePaymentUseCaseImpl({
      paymentFactory: new PaymentFactoryImpl(new SystemDateImpl(new Date())),
      eventDispatcher: domainEventDispatcher,
      logger: new PinoLoggerService(),
      paymentRepository,
      gateways: {
        cart: cartGateway,
        payment: createPaymentGateway,
      },
      useCases: {
        createQRCode: createQRCodeUseCase,
      },
      services: {
        amountCalculator: paymentAmountCalculator,
      },
    });
  });

  describe('Success', () => {
    it('should create a payment and save to database', async () => {
      const input: CreatePaymentUseCaseInput = {
        idempotencyKey: faker.string.uuid(),
        sessionId: faker.string.uuid(),
      };

      const result = await useCase.execute(input);

      const payments = await mongoRepository.find();

      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(250);
      expect(payments[0].type).toBe(PaymentType.PIX);
      expect(payments[0].status).toBe(PaymentStatus.PENDING);
      expect(payments[0].id).toBeDefined();
      expect(payments[0]._id).toBeDefined();

      expect(result.image).toBeDefined();
    });

    it('should create a payment with domain ID preserved', async () => {
      const input: CreatePaymentUseCaseInput = {
        idempotencyKey: faker.string.uuid(),
        sessionId: faker.string.uuid(),
      };

      const qrCodeSpy = jest.spyOn(createPaymentGateway, 'createPayment').mockResolvedValue(
        Result.ok({
          qrCode: 'qrCode-teste',
        })
      );

      const result = await useCase.execute(input);

      const payments = await mongoRepository.find();
      const payment = payments[0];

      expect(payment).toBeDefined();
      expect(payment.id).toBeDefined();
      expect(payment.amount).toBe(250);

      expect(qrCodeSpy).toHaveBeenCalledWith(expect.objectContaining({
        amount: 250,
      }));
      expect(result.image).toMatch(/^data:image\/png;base64,/);

    });

    it('Should send domain events', async () => {
    const input: CreatePaymentUseCaseInput = {
        idempotencyKey: faker.string.uuid(),
        sessionId: faker.string.uuid(),
      };

      const qrCodeSpy = jest.spyOn(createPaymentGateway, 'createPayment').mockResolvedValue(
        Result.ok({
          qrCode: 'qrCode-teste',
        })
      );

      const spyDomainEventDispatcher = jest.spyOn(domainEventDispatcher, 'dispatch')

      await useCase.execute(input);

      const payments = await mongoRepository.find();
      const payment = payments[0];

      expect(payment).toBeDefined();
      expect(payment.id).toBeDefined();
      const expectedEvent: PaymentCreatedEvent = expect.objectContaining({
        data: expect.objectContaining({
          id: expect.objectContaining({ _id: expect.any(String) }),
          amount: expect.objectContaining({ _value: 250 }),
          type: expect.objectContaining({ _value: PaymentType.PIX }),
          status: expect.objectContaining({ _value: PaymentStatus.PENDING }),
          idempotencyKey: expect.objectContaining({ _value: input.idempotencyKey }),
          sessionId: expect.objectContaining({ _value: input.sessionId }),
        }),
        dateTimeOccurred: expect.any(Date),
        eventDate: expect.any(Date),
      });
      expect(spyDomainEventDispatcher).toHaveBeenCalledWith(expectedEvent);


    })
  });

  describe('Failure', () => {
    it('should a duplicated idempotency key', async () => {
      const input: CreatePaymentUseCaseInput = {
        idempotencyKey: faker.string.uuid(),
        sessionId: faker.string.uuid(),
      };

      await expect(useCase.execute(input)).resolves.not.toThrow();

      const payments = await mongoRepository.find();
      expect(payments).toHaveLength(1);

      expect(payments[0].idempotencyKey).toBe(input.idempotencyKey);

      await expect(useCase.execute(input)).rejects.toThrow(
        DomainConflictException,
      );
    });
  });
});
