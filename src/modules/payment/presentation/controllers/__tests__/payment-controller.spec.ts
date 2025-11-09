import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from '../payment.controller';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { CreatePaymentDto } from '../../dto/request/create-payment.dto';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { CreatePaymentUseCaseImpl } from '@payment/application/use-cases/create-payment/create-payment-impl.use-case';

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
          provide: CreatePaymentUseCaseImpl,
          useValue: mockCreatePaymentUseCase,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    createPaymentUseCase = module.get<CreatePaymentUseCase>(
      CreatePaymentUseCaseImpl,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validDto: CreatePaymentDto = {
      amount: 100,
    };

    it('should create a payment successfully', async () => {
      jest.spyOn(mockCreatePaymentUseCase, 'execute').mockResolvedValue({
        qrCode: 'valid-qr-code-123',
      });

      const result = await controller.create(validDto);

      expect(result).toEqual({
        qrCode: 'valid-qr-code-123',
      });

      expect(createPaymentUseCase.execute).toHaveBeenCalledWith({
        amount: validDto.amount,
      });

      expect(createPaymentUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw DomainBusinessException when use case fails', async () => {
      const errorMessage = 'Valor do pagamento deve ser maior que zero.';
      jest
        .spyOn(mockCreatePaymentUseCase, 'execute')
        .mockRejectedValue(
          new DomainBusinessException('Erro ao criar pagamento'),
        );

      await expect(controller.create(validDto)).rejects.toThrow(
        DomainBusinessException,
      );

      await expect(controller.create(validDto)).rejects.toThrow(errorMessage);
    });
  });
});
