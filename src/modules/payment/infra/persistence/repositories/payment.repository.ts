import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { DefaultTypeormRepository } from '@core/infra/database/typeorm/default-typeorm.repository';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PaymentTypeORMEntity } from '../entities/payment-typeorm.entity';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';

export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(
    private readonly database: DefaultTypeormRepository<
      PaymentEntity,
      PaymentTypeORMEntity
    >,
  ) {}

  async save(payment: PaymentEntity): Promise<void> {
    const result = await this.database.create(payment);
    if (result.isFailure) throw result.error;

    result.value.domainEvents.forEach((event) =>
      DomainEventDispatcherImpl.getInstance().dispatch(event),
    );

    return;
  }

  async findById(id: UniqueEntityID): Promise<PaymentEntity | null> {
    const result = await this.database.findById(id);
    if (result.isFailure) return null;
    return result.value;
  }
}
