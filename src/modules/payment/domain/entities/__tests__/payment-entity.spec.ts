import { faker } from '@faker-js/faker';

import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentCreatedEvent } from '@payment/domain/events/payment-created.event';
import { PaymentPaidEvent } from '@payment/domain/events/payment-paid.event';
import { PaymentAlreadyCanceledException } from '@payment/domain/exceptions/payment.exception';
import { PixDetailVO } from '@payment/domain/value-objects/pix-detail.vo';

import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';

describe('PaymentEntity', () => {
  const createPayment = (amount: number) => {
    const now = SystemDateImpl.nowUTC();
    return PaymentEntity.create({
      amount,
      type: PaymentType.PIX,
      expiresAt: new Date(now.getTime() + 3600 * 1000),
      idempotencyKey: faker.string.uuid(),
      sessionId: faker.string.uuid(),
    });
  };

  describe('Payment Creation', () => {
    describe('Success', () => {
      it('should create a payment entity', () => {
        const payment = createPayment(100);

        expect(payment).toBeInstanceOf(PaymentEntity);
        expect(payment.id).toBeDefined();
      });

      it('should create a payment with pending status by default', () => {
        const payment = createPayment(100);

        expect(payment.status.value).toBe(PaymentStatus.PENDING);
      });

      it('should create a payment with correct amount and type', () => {
        const payment = createPayment(250.5);

        expect(payment.amount.value).toBe(250.5);
        expect(payment.type.value).toBe(PaymentType.PIX);
      });
    });

    describe('Failure', () => {
      it('should throw an error when amount is negative', () => {
        const now = SystemDateImpl.nowUTC();
        expect(() =>
          PaymentEntity.create({
            amount: -50,
            type: PaymentType.PIX,
            expiresAt: new Date(now.getTime() + 3600 * 1000),
            idempotencyKey: faker.string.uuid(),
            sessionId: faker.string.uuid(),
          }),
        ).toThrow(DomainBusinessException);
      });

      it('should throw an error when amount is zero', () => {
        const now = SystemDateImpl.nowUTC();
        expect(() =>
          PaymentEntity.create({
            amount: 0,
            type: PaymentType.PIX,
            expiresAt: new Date(now.getTime() + 3600 * 1000),
            idempotencyKey: faker.string.uuid(),
            sessionId: faker.string.uuid(),
          }),
        ).toThrow(DomainBusinessException);
      });
    });
  });

  describe('Payment Cancellation', () => {
    describe('Success', () => {
      it('should cancel a payment', () => {
        const payment = createPayment(100);
        const result = payment.cancel(SystemDateImpl.nowUTC());

        expect(result.isSuccess).toBe(true);
        expect(payment.status.value).toBe(PaymentStatus.CANCELED);
      });
    });

    describe('Failure', () => {
      it('should return error when payment is already cancelled', () => {
        const payment = createPayment(100);
        payment.cancel(SystemDateImpl.nowUTC());

        const result = payment.cancel(SystemDateImpl.nowUTC());

        expect(result.isFailure).toBe(true);
        expect(result.error).toBeInstanceOf(PaymentAlreadyCanceledException);
      });
    });
  });

  describe('PIX Details', () => {
    describe('Success', () => {
      it('should add PIX detail to payment', () => {
        const payment = createPayment(100);
        const pixDetail = PixDetailVO.create({
          qrCode: 'data:image/png;base64,ABC123',
        });

        payment.addPaymentDetail(pixDetail);

        expect(payment.detail).toBeDefined();
        expect(payment.detail).toBeInstanceOf(PixDetailVO);
        expect(payment.detail?.qrCode).toBe('data:image/png;base64,ABC123');
      });

      it('should access PIX detail with type-safety using pixDetail getter', () => {
        const payment = createPayment(100);
        const qrCode = 'data:image/png;base64,TYPE_SAFE';
        const pixDetail = PixDetailVO.create({ qrCode });

        payment.addPaymentDetail(pixDetail);

        expect(payment.pixDetail).toBeDefined();
        expect(payment.pixDetail?.qrCode).toBe(qrCode);
        expect(payment.isPix).toBe(true);
      });

      it('should validate detail type matches payment type', () => {
        const payment = createPayment(100);
        const qrCode = 'data:image/png;base64,VALIDATED';
        const pixDetail = PixDetailVO.create({ qrCode });

        payment.addPaymentDetail(pixDetail);

        expect(payment.pixDetail?.qrCode).toBe(qrCode);
        expect(payment.type.value).toBe(payment.detail?.paymentType);
        expect(payment.detail?.paymentType).toBe(PaymentType.PIX);
      });

      it('should return undefined when accessing pixDetail if not PIX', () => {
        const payment = createPayment(100);

        expect(payment.pixDetail).toBeUndefined();
        expect(payment.detail).toBeUndefined();
      });
    });

    describe('Failure', () => {
      it('should throw an error when adding detail with invalid QR code', () => {
        expect(() =>
          PixDetailVO.create({
            qrCode: '',
          }),
        ).toThrow(DomainBusinessException);
      });
    });
  });

  describe('Payment Provider', () => {
    describe('Success', () => {
      it('should add payment provider', () => {
        const payment = createPayment(100);

        payment.addPaymentProvider({
          externalPaymentId: 'external-id-123',
          provider: PaymentProviders.MERCADO_PAGO,
        });

        expect(payment.paymentProvider).toBeDefined();
        expect(payment.paymentProvider?.value.externalPaymentId).toBe(
          'external-id-123',
        );
        expect(payment.paymentProvider?.value.provider).toBe(
          PaymentProviders.MERCADO_PAGO,
        );
      });
    });
  });

  describe('Payment Status', () => {
    describe('Success', () => {
      it('should mark payment as paid', () => {
        const payment = createPayment(100);

        payment.addPaymentProvider({
          externalPaymentId: 'external-id-123',
          provider: PaymentProviders.MERCADO_PAGO,
        });

        const result = payment.paid(SystemDateImpl.nowUTC());

        expect(result.isSuccess).toBe(true);
        expect(payment.status.value).toBe(PaymentStatus.PAID);
      });
    });

    describe('Failure', () => {
      it('should not pay an already paid payment', () => {
        const payment = createPayment(100);

        payment.addPaymentProvider({
          externalPaymentId: 'external-id-123',
          provider: PaymentProviders.MERCADO_PAGO,
        });

        payment.paid(SystemDateImpl.nowUTC());

        const result = payment.paid(SystemDateImpl.nowUTC());

        expect(result.isFailure).toBe(true);
        expect(result.error).toBeInstanceOf(DomainBusinessException);
      });

      it('should not pay an expired payment', () => {
        const expiresAt = new Date('2024-01-01T12:00:00Z');
        const payment = PaymentEntity.create({
          amount: 100,
          type: PaymentType.PIX,
          expiresAt,
          idempotencyKey: faker.string.uuid(),
          sessionId: faker.string.uuid(),
        });

        payment.addPaymentProvider({
          externalPaymentId: 'external-id-123',
          provider: PaymentProviders.MERCADO_PAGO,
        });

        const futureDate = new Date('2024-01-01T14:00:00Z');
        const result = payment.paid(futureDate);

        expect(result.isFailure).toBe(true);
        expect(result.error).toBeInstanceOf(DomainBusinessException);
      });

      it('should return error when payment provider is not set', () => {
        const payment = createPayment(100);

        const result = payment.paid(SystemDateImpl.nowUTC());

        expect(result.isFailure).toBe(true);
        expect(result.error).toBeInstanceOf(DomainBusinessException);
      });
    });
  });

  describe('Domain Events', () => {
    describe('Success', () => {
      it('should create a payment created event', () => {
        const payment = createPayment(200);

        expect(payment.domainEvents).toHaveLength(1);
        expect(payment.domainEvents[0]).toBeInstanceOf(PaymentCreatedEvent);
      });

      it('should create a payment paid event', () => {
        const payment = createPayment(200);

        payment.addPaymentProvider({
          externalPaymentId: 'external-id-456',
          provider: PaymentProviders.MERCADO_PAGO,
        });

        const result = payment.paid(SystemDateImpl.nowUTC());

        expect(result.isSuccess).toBe(true);
        expect(payment.domainEvents).toHaveLength(2);
        expect(payment.domainEvents[0]).toBeInstanceOf(PaymentCreatedEvent);
        expect(payment.domainEvents[1]).toBeInstanceOf(PaymentPaidEvent);
      });
    });
  });

  describe('Persistence', () => {
    describe('Success', () => {
      it('should create a payment from persistence', () => {
        const now = SystemDateImpl.nowUTC();
        const payment = PaymentEntity.fromPersistence(UniqueEntityID.create(), {
          amount: 150,
          type: PaymentType.PIX,
          status: PaymentStatus.PAID,
          expiresAt: new Date(now.getTime() + 3600 * 1000),
          idempotencyKey: faker.string.uuid(),
          sessionId: faker.string.uuid(),
        });

        expect(payment).toBeInstanceOf(PaymentEntity);
        expect(payment.status.value).toBe(PaymentStatus.PAID);
        expect(payment.amount.value).toBe(150);
      });

      it('should reconstruct payment with correct type', () => {
        const now = SystemDateImpl.nowUTC();
        const id = UniqueEntityID.create();
        const payment = PaymentEntity.fromPersistence(id, {
          amount: 99.99,
          type: PaymentType.PIX,
          status: PaymentStatus.PENDING,
          expiresAt: new Date(now.getTime() + 3600 * 1000),
          idempotencyKey: faker.string.uuid(),
          sessionId: faker.string.uuid(),
        });

        expect(payment.id).toBe(id);
        expect(payment.type.value).toBe(PaymentType.PIX);
        expect(payment.isPix).toBe(true);
      });
    });
  });
});
