import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';
import { PaymentEntity } from '../entities/payment.entity';

export interface PaymentRepository {
  save(payment: PaymentEntity): Promise<void>;
  findById(id: UniqueEntityID): Promise<PaymentEntity | null>;
  findByIdempotencyKey(
    idempotencyKey: IdempotencyKeyVO,
  ): Promise<PaymentEntity | null>;
  findByExternalPaymentId(
    externalPaymentId: string,
  ): Promise<PaymentEntity | null>;
  update(payment: PaymentEntity): Promise<void>;
}

export const PaymentRepository = Symbol('PaymentRepository');
