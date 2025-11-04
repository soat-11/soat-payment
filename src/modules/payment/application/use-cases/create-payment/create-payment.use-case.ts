import { UnitOfWork } from '@core/domain/unit-of-work';
import { PaymentDetailEntity } from '@payment/domain/entities/payment-detail.entity';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';

export class CreatePaymentUseCaseImpl {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(input: { amount: number; qrCode: string }): Promise<void> {
    await this.uow.start();

    try {
      const payment = PaymentEntity.create({
        amount: input.amount,
        type: PaymentType.PIX,
      });

      const paymentDetail = PaymentDetailEntity.createPixDetail(payment.id, {
        qrCode: input.qrCode,
      });

      payment.addPaymentDetail(paymentDetail.info);

      await this.uow.payments.save(payment);
      await this.uow.paymentDetails.save(payment.paymentDetail);

      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}
