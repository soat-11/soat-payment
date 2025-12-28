import { faker } from '@faker-js/faker';

import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PaymentProvider } from '@payment/domain/value-objects/payment-provider.vo';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';
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
    const now = SystemDateImpl.nowUTC();
    return PaymentEntity.create({
      amount: 100,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
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

  beforeEach(() => {
    repository = {
      findByIdempotencyKey: jest.fn(),
      findByExternalPaymentId: jest.fn(),
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
    it('Should process payment when found by externalPaymentId', async () => {
      const externalPaymentId = faker.string.uuid();
      const idempotencyKey = faker.string.uuid();
      const provider = PaymentProvider.create({
        externalPaymentId: externalPaymentId,
        provider: PaymentProviders.MERCADO_PAGO,
      });

      const result: PaymentEntity = paymentEntityFactory({
        externalReference: idempotencyKey,
        provider,
      });

      jest
        .spyOn(repository, 'findByExternalPaymentId')
        .mockResolvedValue(result);

      const eventsSpy = jest.spyOn(dispatcher, 'dispatch');

      const response = await useCase.markAsPaid(externalPaymentId);

      expect(response.isSuccess).toBeTruthy();
      expect(repository.findByExternalPaymentId).toHaveBeenCalledWith(
        externalPaymentId,
      );
      expect(eventsSpy).toHaveBeenCalled();
    });
  });

  describe('Failure', () => {
    it('Should not process payment when paymentReference is empty', async () => {
      const response = await useCase.markAsPaid('');

      expect(response.isFailure).toBeTruthy();
      expect(response.error).toStrictEqual(
        new DomainBusinessException('Invalid payment reference'),
      );
    });

    it('Should not process payment when payment not found', async () => {
      const externalPaymentId = faker.string.uuid();

      jest.spyOn(repository, 'findByExternalPaymentId').mockResolvedValue(null);

      const response = await useCase.markAsPaid(externalPaymentId);

      expect(response.isFailure).toBeTruthy();
      expect(response.error).toStrictEqual(
        new DomainBusinessException('Payment not found'),
      );
    });
  });
});
