import { Test, TestingModule } from '@nestjs/testing';
import { StreamableFile } from '@nestjs/common';
import { PaymentController } from '../payment.controller';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { CreatePaymentDto } from '../../dto/request/create-payment.dto';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';

describe('PaymentController', () => {
  let controller: PaymentController;
  let createPaymentUseCase: CreatePaymentUseCase;

  const mockCreatePaymentUseCase: CreatePaymentUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: CreatePaymentUseCase,
          useValue: mockCreatePaymentUseCase,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    createPaymentUseCase =
      module.get<CreatePaymentUseCase>(CreatePaymentUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validDto: CreatePaymentDto = {
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000';

    it('should create a payment and return QR Code image as StreamableFile', async () => {
      const mockImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';
      jest.spyOn(mockCreatePaymentUseCase, 'execute').mockResolvedValue({
        image: mockImageBase64,
      });

      const result = await controller.create(validDto, idempotencyKey);

      expect(result).toBeInstanceOf(StreamableFile);
      expect(createPaymentUseCase.execute).toHaveBeenCalledWith({
        sessionId: validDto.sessionId,
        idempotencyKey: idempotencyKey,
      });
      expect(createPaymentUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw DomainBusinessException when use case fails', async () => {
      const errorMessage = 'Erro ao criar pagamento';
      jest
        .spyOn(mockCreatePaymentUseCase, 'execute')
        .mockRejectedValue(new DomainBusinessException(errorMessage));

      await expect(controller.create(validDto, idempotencyKey)).rejects.toThrow(
        DomainBusinessException,
      );

      await expect(controller.create(validDto, idempotencyKey)).rejects.toThrow(
        errorMessage,
      );
    });
  });
});
