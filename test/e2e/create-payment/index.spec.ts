import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mockClient } from 'aws-sdk-client-mock';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { CoreModule } from '@core/core.module';
import { PaymentPresentationModule } from '@payment/presentation/presentation.module';

import {
  FakeCartGateway,
  FakeCreatePaymentGateway,
  FakeLogger,
} from '@test/fakes';

import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { CartGateway } from '@payment/domain/gateways/cart.gateway';
import { CreatePaymentGateway } from '@payment/domain/gateways/create-payment.gateway';
import { createDSL, DSL } from '@test/dsl';

const sqsMock = mockClient(SQSClient);

describe('Create Payment E2E - SQS Consumer', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let dsl: DSL;

  let fakeLogger: FakeLogger;
  let fakeCartGateway: FakeCartGateway;
  let fakeCreatePaymentGateway: FakeCreatePaymentGateway;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    process.env.MONGODB_URI = mongoUri;
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_SQS_CREATE_PAYMENT_QUEUE_URL =
      'http://localhost:4566/000000000000/create-payment-queue';

    fakeLogger = new FakeLogger();
    fakeCartGateway = new FakeCartGateway();
    fakeCreatePaymentGateway = new FakeCreatePaymentGateway();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CoreModule, PaymentPresentationModule],
    })
      .overrideProvider(AbstractLoggerService)
      .useValue(fakeLogger)
      .overrideProvider(CartGateway)
      .useValue(fakeCartGateway)
      .overrideProvider(CreatePaymentGateway)
      .useValue(fakeCreatePaymentGateway)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dsl = createDSL(app);
  });

  afterAll(async () => {
    if (app) {
      const dataSource = app.get(DataSource);
      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }
      await app.close();
    }
    if (mongoServer) {
      try {
        await mongoServer.stop();
      } catch {}
    }
    delete process.env.MONGODB_URI;
    delete process.env.AWS_REGION;
    delete process.env.AWS_SQS_CREATE_PAYMENT_QUEUE_URL;
  });

  beforeEach(async () => {
    await dsl.clearAll();
    fakeLogger.clear();
    sqsMock.reset();

    fakeCartGateway.setCartResponse({
      items: [
        { sku: '123', quantity: 2, unitPrice: 100 },
        { sku: '456', quantity: 1, unitPrice: 50 },
      ],
    });

    sqsMock.on(DeleteMessageCommand).resolves({});
    sqsMock.on(ReceiveMessageCommand).resolves({ Messages: [] });
  });

  describe('createPixPayment', () => {
    it('should create a PIX payment via SQS message', async () => {
      const payload = await dsl.payment.createPixPayment();

      const payments = await dsl.repositories.payment.find();
      expect(payments).toHaveLength(1);
      expect(payments[0].sessionId).toBe(payload.sessionId);
      expect(payments[0].idempotencyKey).toBe(payload.idempotencyKey);

      expect(fakeLogger.hasLog('Creating payment')).toBe(true);
      expect(fakeLogger.hasLog('Payment created')).toBe(true);
    });

    it('should create payment with custom sessionId and idempotencyKey', async () => {
      const sessionId = uuidv4();
      const idempotencyKey = uuidv4();

      await dsl.payment.createPixPayment({ sessionId, idempotencyKey });

      const payments = await dsl.repositories.payment.find();
      expect(payments).toHaveLength(1);
      expect(payments[0].sessionId).toBe(sessionId);
      expect(payments[0].idempotencyKey).toBe(idempotencyKey);
    });

    it('should handle duplicate payment (idempotency)', async () => {
      const idempotencyKey = uuidv4();

      await dsl.payment.createPixPayment({ idempotencyKey });

      let payments = await dsl.repositories.payment.find();
      expect(payments).toHaveLength(1);

      fakeLogger.clear();
      await dsl.payment.createPixPayment({ idempotencyKey });

      payments = await dsl.repositories.payment.find();
      expect(payments).toHaveLength(1);

      expect(fakeLogger.hasError('Failed to create payment (no retry)')).toBe(
        true,
      );
    });

    it('should calculate correct amount from cart items', async () => {
      fakeCartGateway.setCartResponse({
        items: [
          { sku: 'BURGER-001', quantity: 2, unitPrice: 2500 },
          { sku: 'FRIES-001', quantity: 1, unitPrice: 1000 },
        ],
      });

      const payload = await dsl.payment.createPixPayment();

      const payment = await dsl.repositories.payment.findOne({
        where: { idempotencyKey: payload.idempotencyKey },
      });

      expect(payment).toBeDefined();
      expect(payment!.amount).toBe(6000);
    });
  });
});
