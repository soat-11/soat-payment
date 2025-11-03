import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentEntity } from '../payment.entity';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentPaidEvent } from '@payment/domain/events/payment-paid.event';
import { PaymentCreatedEvent } from '@payment/domain/events/payment-created.event';

describe('PaymentEntity', () => {
  describe('Success', () => {
    it('should create a payment entity', () => {
      const payment = PaymentEntity.create({
        amount: 100,
        type: PaymentType.PIX,
      });

      expect(payment).toBeInstanceOf(PaymentEntity);
    });

    it('Should create a payment with pending status by default', () => {
      const payment = PaymentEntity.create({
        amount: 100,
        type: PaymentType.PIX,
      });

      expect(payment.status.value).toBe(PaymentStatus.PENDING);
    });

    it('Should paid payment', () => {
      const payment = PaymentEntity.create({
        amount: 100,
        type: PaymentType.PIX,
      });

      payment.paid();

      expect(payment.status.value).toBe(PaymentStatus.PAID);
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
      const payment = PaymentEntity.create({
        amount: 200,
        type: PaymentType.PIX,
      });

      payment.paid();
      expect(payment.domainEvents[0]).toBeInstanceOf(PaymentCreatedEvent);
    });

    it('Should create a payment paid event', () => {
      const payment = PaymentEntity.create({
        amount: 200,
        type: PaymentType.PIX,
      });

      payment.paid();
      expect(payment.domainEvents[1]).toBeInstanceOf(PaymentPaidEvent);
    });
  });

  describe('Failure', () => {
    it('should throw an error when amount is negative', () => {
      expect(() =>
        PaymentEntity.create({
          amount: -50,
          type: PaymentType.PIX,
        }),
      ).toThrow(DomainBusinessException);
    });

    it('should not pay an already paid payment', () => {
      const payment = PaymentEntity.create({
        amount: 100,
        type: PaymentType.PIX,
      });

      payment.paid();

      expect(() => payment.paid()).toThrow(DomainBusinessException);
    });

    it('should not pay an expired payment', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
      const payment = PaymentEntity.create({
        amount: 100,
        type: PaymentType.PIX,
      });

      jest.setSystemTime(new Date('2024-01-01T14:00:00Z'));
      expect(() => payment.paid()).toThrow(DomainBusinessException);
      jest.useRealTimers();
    });
  });
});
