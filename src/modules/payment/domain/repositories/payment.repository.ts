import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentEntity } from '../entities/payment.entity';

export interface PaymentRepository {
  save(payment: PaymentEntity): Promise<void>;
  findById(id: UniqueEntityID): Promise<PaymentEntity | null>;
}
