import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentEntity } from '../payment.entity';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentPaidEvent } from '@payment/domain/events/payment-paid.event';
import { PaymentCreatedEvent } from '@payment/domain/events/payment-created.event';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';

describe('PaymentEntity', () => {
  const createPaymentWithExpiresAt = (amount: number) => {
    return PaymentEntity.create({
      amount,
      type: PaymentType.PIX,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    });
  };

  describe('Success', () => {
    it('should create a payment entity', () => {
      const payment = createPaymentWithExpiresAt(100);

      expect(payment).toBeInstanceOf(PaymentEntity);
    });

    it('Should create a payment with pending status by default', () => {
      const payment = createPaymentWithExpiresAt(100);

      expect(payment.status.value).toBe(PaymentStatus.PENDING);
    });

    it('Should paid payment', () => {
      const payment = createPaymentWithExpiresAt(100);

      payment.addPaymentProvider({
        externalPaymentId: 'external-id-123',
        provider: PaymentProviders.MERCADO_PAGO,
      });

      payment.paid(new Date()); // Pass current date

      expect(payment.status.value).toBe(PaymentStatus.PAID);
      expect(payment.paymentProvider?.value.externalPaymentId).toBe(
        'external-id-123',
      );
      expect(payment.paymentProvider?.value.provider).toBe(
        PaymentProviders.MERCADO_PAGO,
      );
    });

    it('should create a payment from persistence', () => {
      const payment = PaymentEntity.fromPersistence(UniqueEntityID.create(), {
        amount: 150,
        type: PaymentType.PIX,
        status: PaymentStatus.PAID,

        expiresAt: new Date(Date.now() + 3600 * 1000),
      });

      expect(payment).toBeInstanceOf(PaymentEntity);
      expect(payment.status.value).toBe(PaymentStatus.PAID);
    });

    it('Should create a payment created event', () => {
      const payment = createPaymentWithExpiresAt(200);

      expect(payment.domainEvents[0]).toBeInstanceOf(PaymentCreatedEvent);
    });

    it('Should create a payment paid event', () => {
      const payment = createPaymentWithExpiresAt(200);

      payment.addPaymentProvider({
        externalPaymentId: 'external-id-456',
        provider: PaymentProviders.MERCADO_PAGO,
      });

      payment.paid(new Date());
      expect(payment.domainEvents[1]).toBeInstanceOf(PaymentPaidEvent);
      expect(payment.paymentProvider?.value.externalPaymentId).toBe(
        'external-id-456',
      );
    });
  });

  describe('Failure', () => {
    it('should throw an error when amount is negative', () => {
      expect(() =>
        PaymentEntity.create({
          amount: -50,
          type: PaymentType.PIX,
          expiresAt: new Date(Date.now() + 3600 * 1000),
        }),
      ).toThrow(DomainBusinessException);
    });

    it('should not pay an already paid payment', () => {
      const payment = createPaymentWithExpiresAt(100);

      payment.addPaymentProvider({
        externalPaymentId: 'external-id-123',
        provider: PaymentProviders.MERCADO_PAGO,
      });

      payment.paid(new Date());

      expect(() => payment.paid(new Date())).toThrow(DomainBusinessException);
    });

    it('should not pay an expired payment', () => {
      const expiresAt = new Date('2024-01-01T12:00:00Z');
      const payment = PaymentEntity.create({
        amount: 100,
        type: PaymentType.PIX,
        expiresAt,
      });

      payment.addPaymentProvider({
        externalPaymentId: 'external-id-123',
        provider: PaymentProviders.MERCADO_PAGO,
      });

      const futureDate = new Date('2024-01-01T14:00:00Z');
      expect(() => payment.paid(futureDate)).toThrow(DomainBusinessException);
    });

    it('should throw an error when payment provider is invalid', () => {
      const payment = createPaymentWithExpiresAt(100);

      expect(() => payment.paid(new Date())).toThrow(DomainBusinessException);
    });
  });
});
