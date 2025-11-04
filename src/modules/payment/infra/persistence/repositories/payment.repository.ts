import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';

import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PaymentTypeORMEntity } from '../entities/payment-typeorm.entity';

import { Repository } from 'typeorm';
import { PaymentMapper } from '../mapper/payment.mapper';

export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(
    private readonly database: Repository<PaymentTypeORMEntity>,
    private readonly paymentMapper: PaymentMapper,
  ) {}

  async save(payment: PaymentEntity): Promise<void> {
    const orm = this.paymentMapper.toORM(payment);
    if (orm.isFailure) throw orm.error;
    await this.database.save(orm.value);

    return;
  }

  async findById(id: UniqueEntityID): Promise<PaymentEntity | null> {
    const result = await this.database.findOneBy({
      id: id,
    });

    if (!result) return null;
    return this.paymentMapper.toDomain(result).value;
  }
}
