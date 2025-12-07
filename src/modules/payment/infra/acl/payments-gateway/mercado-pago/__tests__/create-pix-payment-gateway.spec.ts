import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import {
  DefaultHttpClientResponse,
  PostMethod,
} from '@core/infra/http/client/http-client';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { CreateQRCodeMercadoPagoResponse } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos';
import { CreatePixPaymentGatewayImpl } from '@payment/infra/acl/payments-gateway/mercado-pago/gateways/create-pix-payment.gateway';

describe('CreatePixPaymentGateway', () => {
  let client: PostMethod;
  let gateway: CreatePixPaymentGatewayImpl;

  const mockSuccessResponse: DefaultHttpClientResponse<CreateQRCodeMercadoPagoResponse> =
    {
      status: 200,
      data: {
        expiration_time: '2025-11-20T16:04:55-03:00',
        external_reference: '123',
        message: '123',
        type_response: {
          qr_data: '123',
        },
      },
      headers: {},
    };

  beforeAll(() => {
    process.env.MERCADO_PAGO_POS_ID = '123';
  });

  beforeEach(() => {
    client = {
      post: jest.fn().mockResolvedValue(mockSuccessResponse),
    };
    gateway = new CreatePixPaymentGatewayImpl(client, new PinoLoggerService());
  });

  describe('Sucesso', () => {
    it('deve criar um pagamento com expiração de 10 minutos', async () => {
      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

      const result = await gateway.createPayment({
        amount: 10,
        expirationTime: tenMinutesFromNow,
        externalReference: '123',
        idempotencyKey: '123',
        items: [{ title: 'Item 1', unitPrice: 10, quantity: 1 }],
        type: PaymentType.PIX,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.qrCode).toBeDefined();
      expect(typeof result.value.qrCode).toBe('string');
    });

    it('deve criar um pagamento com expiração de 1 hora', async () => {
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

      const result = await gateway.createPayment({
        amount: 100,
        expirationTime: oneHourFromNow,
        externalReference: '456',
        idempotencyKey: '456',
        items: [{ title: 'Item 2', unitPrice: 100, quantity: 1 }],
        type: PaymentType.PIX,
      });

      expect(result.isSuccess).toBe(true);
    });

    it('deve criar um pagamento com expiração de 5 minutos', async () => {
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

      const result = await gateway.createPayment({
        amount: 50,
        expirationTime: fiveMinutesFromNow,
        externalReference: '789',
        idempotencyKey: '789',
        items: [{ title: 'Item 3', unitPrice: 50, quantity: 1 }],
        type: PaymentType.PIX,
      });

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('Validação de expiration_time', () => {
    it('deve falhar quando expiração está no passado', async () => {
      const pastDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos atrás

      const result = await gateway.createPayment({
        amount: 10,
        expirationTime: pastDate,
        externalReference: '123',
        idempotencyKey: '123',
        items: [{ title: 'Item 1', unitPrice: 10, quantity: 1 }],
        type: PaymentType.PIX,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
      expect(result.error.message).toContain('expiração');
    });

    it('deve falhar quando expiração é menor que 1 minuto', async () => {
      const thirtySecondsFromNow = new Date(Date.now() + 30 * 1000);

      const result = await gateway.createPayment({
        amount: 10,
        expirationTime: thirtySecondsFromNow,
        externalReference: '123',
        idempotencyKey: '123',
        items: [{ title: 'Item 1', unitPrice: 10, quantity: 1 }],
        type: PaymentType.PIX,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(DomainBusinessException);
      expect(result.error.message).toContain('mínimo');
    });
  });

  describe('Formato ISO 8601 Duration', () => {
    it('deve gerar P0DT10M para 10 minutos', async () => {
      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

      await gateway.createPayment({
        amount: 10,
        expirationTime: tenMinutesFromNow,
        externalReference: '123',
        idempotencyKey: '123',
        items: [{ title: 'Item 1', unitPrice: 10, quantity: 1 }],
        type: PaymentType.PIX,
      });

      expect(client.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          expiration_time: expect.stringMatching(/^P0DT\d+M$/),
        }),
        expect.any(Object),
      );
    });

    it('deve gerar P0DT1H para 1 hora', async () => {
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

      await gateway.createPayment({
        amount: 10,
        expirationTime: oneHourFromNow,
        externalReference: '123',
        idempotencyKey: '123',
        items: [{ title: 'Item 1', unitPrice: 10, quantity: 1 }],
        type: PaymentType.PIX,
      });

      expect(client.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          expiration_time: expect.stringMatching(/^P0DT1H$/),
        }),
        expect.any(Object),
      );
    });

    it('deve gerar P0DT1H30M para 1 hora e 30 minutos', async () => {
      const oneHourThirtyMinutes = new Date(Date.now() + 90 * 60 * 1000);

      await gateway.createPayment({
        amount: 10,
        expirationTime: oneHourThirtyMinutes,
        externalReference: '123',
        idempotencyKey: '123',
        items: [{ title: 'Item 1', unitPrice: 10, quantity: 1 }],
        type: PaymentType.PIX,
      });

      expect(client.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          expiration_time: expect.stringMatching(/^P0DT1H30M$/),
        }),
        expect.any(Object),
      );
    });
  });
})