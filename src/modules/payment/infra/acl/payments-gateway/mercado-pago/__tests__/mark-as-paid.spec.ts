import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { faker } from '@faker-js/faker';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PaymentProvider } from '@payment/domain/value-objects/payment-provider.vo';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
import { ProcessPaymentDTOSchemaRequest } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';
import { MarkAsPaidGatewayImpl } from '@payment/infra/acl/payments-gateway/mercado-pago/gateways/mark-as-paid.gateway';

describe('MarkAsPaidGatewayImpl', () => {
  let useCase: MarkAsPaidGatewayImpl;
  let repository: PaymentRepository;
  let logger: AbstractLoggerService;
  let dispatcher: DomainEventDispatcher;

  const paymentEntityFactory = ({
    externalReference,
    provider,
  }: {
    externalReference: string;
    provider: PaymentProvider;
  }) => {
    return PaymentEntity.create({
      amount: 100,
      expiresAt: new Date(new Date().getTime() + 10 * 60 * 1000),
      idempotencyKey: externalReference,
      sessionId: faker.string.uuid(),
      type: PaymentType.PIX,
    })
      .addPaymentDetail(
        PixDetailVO.create({
          qrCode: faker.string.uuid(),
        }),
      )
      .addPaymentProvider({
        externalPaymentId: provider.value.externalPaymentId,
        provider: provider.value.provider,
      });
  };

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
    repository = {
      findByIdempotencyKey: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
    };
    logger = new PinoLoggerService({
      suppressConsole: true,
    });
    dispatcher = new DomainEventDispatcherImpl();
    useCase = new MarkAsPaidGatewayImpl(repository, logger, dispatcher);
  });

  describe('Success', () => {
    it('Should process payment', async () => {
      const externalReference = faker.string.uuid();
      const provider = PaymentProvider.create({
        externalPaymentId: externalReference,
        provider: PaymentProviders.MERCADO_PAGO,
      });

      const result: PaymentEntity = paymentEntityFactory({
        externalReference,
        provider,
      });

      jest.spyOn(repository, 'findByIdempotencyKey').mockResolvedValue(result);

      const eventsSpy = jest.spyOn(dispatcher, 'dispatch');

      const response = await useCase.markAsPaid(
        externalReference,
        mercadoPagoRequest,
      );

      expect(response.isSuccess).toBeTruthy();

      expect(eventsSpy).toHaveBeenCalled();
    });
  });

  describe('Failure', () => {
    it('Should not process payment when action is wrong', async () => {
      const externalReference = faker.string.uuid();
      const provider = PaymentProvider.create({
        externalPaymentId: externalReference,
        provider: PaymentProviders.MERCADO_PAGO,
      });

      const result: PaymentEntity = paymentEntityFactory({
        externalReference,
        provider,
      });

      jest.spyOn(repository, 'findByIdempotencyKey').mockResolvedValue(result);

      const response = await useCase.markAsPaid(externalReference, {
        ...mercadoPagoRequest,
        action: 'payment.te',
      });

      expect(response.isFailure).toBeTruthy();
      expect(response.error).toStrictEqual(
        new DomainBusinessException('Invalid action'),
      );
    });
  });
});
