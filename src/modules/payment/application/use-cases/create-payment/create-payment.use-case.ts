import { DomainPersistenceException } from '@core/domain/exceptions/domain.exception';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';
import { executeAllOrFail } from '@core/utils/promise-utils';
import { PaymentDetailEntity } from '@payment/domain/entities/payment-detail.entity';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { PaymentUnitOfWork } from '@payment/domain/repositories/payment-uow.repository';

export class CreatePaymentUseCaseImpl {
  constructor(private readonly uow: PaymentUnitOfWork) {}

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

      await executeAllOrFail([
        this.uow.paymentRepository.save(payment),
        this.uow.paymentDetailRepository.save(paymentDetail),
      ]);

      await this.uow.commit();
      payment.domainEvents.forEach((event) =>
        DomainEventDispatcherImpl.getInstance().dispatch(event),
      );
    } catch (error) {
      await this.uow.rollback();
      if (error instanceof Error) {
        throw error;
      }

      throw new DomainPersistenceException('Erro ao salvar pagamento');
    }
  }
}
