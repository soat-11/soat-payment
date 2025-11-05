import { DataSource } from 'typeorm';

import { CreatePaymentUseCaseImpl } from '@payment/application/use-cases/create-payment/create-payment-impl.use-case';
import { PaymentRepositoryImpl } from '@payment/infra/persistence/repositories/payment.repository';
import { PaymentDetailRepositoryImpl } from '@payment/infra/persistence/repositories/payment-detail.repository';
import { TypeormPaymentUOW } from '@payment/infra/persistence/typeorm-payment.uow';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentTypeORMEntity } from '@payment/infra/persistence/entities/payment-typeorm.entity';
import { PixDetailORMEntity } from '@payment/infra/persistence/entities/pix-detail-typeorm.entity';
import { PixDetailMapper } from '@payment/infra/persistence/mapper/pix-detail.mapper';
import { PaymentMapper } from '@payment/infra/persistence/mapper/payment.mapper';
import { DomainPersistenceException } from '@core/domain/exceptions/domain.exception';
import {
  CreatePaymentUseCase,
  CreatePaymentUseCaseInput,
} from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';

describe('CreatePaymentUseCase - Integration Test', () => {
  let dataSource: DataSource;
  let uow: TypeormPaymentUOW;
  let useCase: CreatePaymentUseCase;
  let paymentRepository: PaymentRepositoryImpl;
  let paymentDetailRepository: PaymentDetailRepositoryImpl;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [PaymentTypeORMEntity, PixDetailORMEntity],
      synchronize: true,
      logging: false,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.getRepository(PixDetailORMEntity).clear();
    await dataSource.getRepository(PaymentTypeORMEntity).clear();

    const paymentMapper = new PaymentMapper();
    const pixDetailMapper = new PixDetailMapper();

    paymentRepository = new PaymentRepositoryImpl(
      dataSource,
      paymentMapper,
      new PinoLoggerService(),
    );

    paymentDetailRepository = new PaymentDetailRepositoryImpl(
      dataSource,
      pixDetailMapper,
      new PinoLoggerService(),
    );

    uow = new TypeormPaymentUOW(
      dataSource,
      paymentRepository,
      paymentDetailRepository,
      new PinoLoggerService(),
    );

    useCase = new CreatePaymentUseCaseImpl(uow, new PinoLoggerService());
  });

  describe('Success', () => {
    it('should create a payment and save to database', async () => {
      const input: CreatePaymentUseCaseInput = {
        amount: 100,
        qrCode: 'test-qr-code-123',
      };

      await useCase.execute(input);

      const payments = await dataSource
        .getRepository(PaymentTypeORMEntity)
        .find();

      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(100);
      expect(payments[0].type).toBe(PaymentType.PIX);
      expect(payments[0].status).toBe(PaymentStatus.PENDING);

      const paymentDetails = await dataSource
        .getRepository(PixDetailORMEntity)
        .find();

      expect(paymentDetails).toHaveLength(1);
      expect(paymentDetails[0].qrCode).toBe('test-qr-code-123');
      expect(paymentDetails[0].paymentId.value).toBe(payments[0].id.value);
    });
  });

  describe('Rollback', () => {
    it('should rollback transaction on error and not save to database', async () => {
      const input: CreatePaymentUseCaseInput = {
        amount: -100,
        qrCode: 'test-qr-code',
      };

      await expect(useCase.execute(input)).rejects.toThrow();

      const payments = await dataSource
        .getRepository(PaymentTypeORMEntity)
        .find();

      const paymentDetails = await dataSource
        .getRepository(PixDetailORMEntity)
        .find();

      expect(payments).toHaveLength(0);
      expect(paymentDetails).toHaveLength(0);
    });

    it('should rollback on validation error during detail entity creation', async () => {
      const input: CreatePaymentUseCaseInput = {
        amount: 100,
        qrCode: '',
      };

      await expect(useCase.execute(input)).rejects.toThrow();

      const payments = await dataSource
        .getRepository(PaymentTypeORMEntity)
        .find();

      const paymentDetails = await dataSource
        .getRepository(PixDetailORMEntity)
        .find();

      expect(payments).toHaveLength(0);
      expect(paymentDetails).toHaveLength(0);
    });

    it('Should rollback on detail fails to save', async () => {
      const input: CreatePaymentUseCaseInput = {
        amount: -100,
        qrCode: 'test-qr-code',
      };

      await expect(useCase.execute(input)).rejects.toThrow();

      const payments = await dataSource
        .getRepository(PaymentTypeORMEntity)
        .find();

      const paymentDetails = await dataSource
        .getRepository(PixDetailORMEntity)
        .find();

      expect(payments).toHaveLength(0);
      expect(paymentDetails).toHaveLength(0);
    });
  });

  describe('Transaction Isolation', () => {
    it('should maintain transaction isolation between tests', async () => {
      const input: CreatePaymentUseCaseInput = {
        amount: 500,
        qrCode: 'isolation-test-qr-code',
      };

      jest
        .spyOn(uow.paymentDetailRepository, 'save')
        .mockRejectedValue(
          new DomainPersistenceException(
            'Erro ao salvar detalhe de pagamento Pix',
          ),
        );

      await expect(useCase.execute(input)).rejects.toThrow();

      const payments = await dataSource
        .getRepository(PaymentTypeORMEntity)
        .find();

      expect(payments).toHaveLength(0);
    });
  });
});
