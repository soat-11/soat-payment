import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';

export class FakePaymentRepository implements PaymentRepository {
  private storage = new Map<string, PaymentEntity>();

  savedPayments: PaymentEntity[] = [];
  updatedPayment: PaymentEntity | null = null;

  async findById(id: UniqueEntityID): Promise<PaymentEntity | null> {
    return this.storage.get(id.value) ?? null;
  }

  async save(payment: PaymentEntity): Promise<void> {
    this.savedPayments.push(payment);
    this.storage.set(payment.id.value, payment);
  }

  async update(payment: PaymentEntity): Promise<void> {
    this.updatedPayment = payment;
    this.storage.set(payment.id.value, payment);
  }

  async findByIdempotencyKey(
    idempotencyKey: IdempotencyKeyVO,
  ): Promise<PaymentEntity | null> {
    for (const payment of this.storage.values()) {
      if (payment.idempotencyKey.value === idempotencyKey.value) {
        return payment;
      }
    }
    return null;
  }

  clear(): void {
    this.storage.clear();
    this.savedPayments = [];
    this.updatedPayment = null;
  }
}

