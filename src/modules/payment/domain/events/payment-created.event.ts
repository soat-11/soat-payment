import { DomainEvent } from '@core/events/domain-event';
import { PaymentEntity } from '../entities/payment.entity';

export class PaymentCreatedEvent extends DomainEvent<PaymentEntity> {
  constructor(aggregate: PaymentEntity) {
    super(aggregate);
  }
}
