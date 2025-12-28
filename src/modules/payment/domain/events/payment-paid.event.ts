import { DomainEvent } from '@core/events/domain-event';
import { PaymentEntity } from '@modules/payment/domain/entities/payment.entity';

export class PaymentPaidEvent extends DomainEvent<PaymentEntity> {
  constructor(payload: PaymentEntity) {
    super(payload);
  }
}
