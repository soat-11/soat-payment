import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentEntity } from '../payment.entity';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';

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
