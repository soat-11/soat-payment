import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentDetailEntity } from '../entities/payment-detail.entity';

export interface PaymentDetailRepository {
  save(detail: PaymentDetailEntity): Promise<void>;
  findByPaymentId(
    paymentId: UniqueEntityID,
  ): Promise<PaymentDetailEntity | null>;
}
