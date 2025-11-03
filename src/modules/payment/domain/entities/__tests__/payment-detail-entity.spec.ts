import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentDetailEntity } from '../payment-detail.entity';
import { PaymentEntity } from '../payment.entity';

describe('PaymentEntity', () => {
  describe('Success', () => {
    it('should create a pix payment entity', () => {
      const payment = PaymentEntity.create({
        amount: 100,
        type: PaymentType.PIX,
      });
      const paymentDetail = PaymentDetailEntity.createPixDetail(payment.id, {
        expiresAt: payment.expiresAt,

        qrCode: 'someqrCodeData',
      });

      expect(paymentDetail).toBeInstanceOf(PaymentDetailEntity);
      expect(paymentDetail.paymentId).toBe(payment.id);
      expect(paymentDetail.info.value.qrCode).toBe('someqrCodeData');

      expect(paymentDetail.info.value.expiresAt).toBe(payment.expiresAt);
    });
  });
});
