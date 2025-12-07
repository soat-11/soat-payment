import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { faker } from '@faker-js/faker';
import { ProcessPaymentDTOSchemaRequest } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';
import {
  MarkAsPaidGatewayImpl,
  PaymentSignalService,
} from '@payment/infra/acl/payments-gateway/mercado-pago/gateways/mark-as-paid.gateway';

describe('MarkAsPaidGatewayImpl', () => {
  let gateway: MarkAsPaidGatewayImpl;
  let logger: AbstractLoggerService;
  let signalService: jest.Mocked<PaymentSignalService>;

  const mercadoPagoRequest: ProcessPaymentDTOSchemaRequest = {
    action: 'payment.created',
    data: {
      id: '123456789',
    },
    api_version: '1.0',
    application_id: faker.string.uuid(),
    date_created: new Date().toISOString(),
    id: '123456789',
    live_mode: true,
    type: 'payment',
    user_id: faker.number.int(),
  };

  beforeEach(() => {
    logger = new PinoLoggerService({
      suppressConsole: true,
    });
    signalService = {
      signalPaymentConfirmed: jest.fn(),
      signalPaymentFailed: jest.fn(),
    };

    gateway = new MarkAsPaidGatewayImpl(logger, signalService);
  });

  describe('Success', () => {
    it('should send signal to workflow when action is payment.created', async () => {
      const idempotencyKey = faker.string.uuid();

      signalService.signalPaymentConfirmed.mockResolvedValue();

      const response = await gateway.markAsPaid(
        idempotencyKey,
        mercadoPagoRequest,
      );

      expect(response.isSuccess).toBeTruthy();
      expect(signalService.signalPaymentConfirmed).toHaveBeenCalledWith(
        idempotencyKey,
      );
    });
  });

  describe('Failure', () => {
    it('should not process payment when action is invalid', async () => {
      const idempotencyKey = faker.string.uuid();

      const response = await gateway.markAsPaid(idempotencyKey, {
        ...mercadoPagoRequest,
        action: 'payment.invalid',
      });

      expect(response.isFailure).toBeTruthy();
      expect(response.error).toStrictEqual(
        new DomainBusinessException('Invalid action'),
      );
      expect(signalService.signalPaymentConfirmed).not.toHaveBeenCalled();
    });

    it('should return ok when workflow not found (payment expired)', async () => {
      const idempotencyKey = faker.string.uuid();

      signalService.signalPaymentConfirmed.mockRejectedValue(
        new Error('workflow not found'),
      );

      const response = await gateway.markAsPaid(
        idempotencyKey,
        mercadoPagoRequest,
      );

      // Should return ok to acknowledge webhook (don't retry)
      expect(response.isSuccess).toBeTruthy();
    });

    it('should return failure when signal service throws unexpected error', async () => {
      const idempotencyKey = faker.string.uuid();

      signalService.signalPaymentConfirmed.mockRejectedValue(
        new Error('Connection failed'),
      );

      const response = await gateway.markAsPaid(
        idempotencyKey,
        mercadoPagoRequest,
      );

      expect(response.isFailure).toBeTruthy();
      expect(response.error).toStrictEqual(
        new DomainBusinessException('Failed to process webhook'),
      );
    });
  });
});
