import { Repository } from 'typeorm';
import { PixDetailMapper } from '../mapper/pix-detail.mapper';
import { PixDetailORMEntity } from '../entities/pix-detail-typeorm.entity';

import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { PaymentDetailEntity } from '@payment/domain/entities/payment-detail.entity';

export interface PaymentDetailRepository {
  save(detail: PaymentDetailEntity): Promise<void>;
  findByPaymentId(
    paymentId: UniqueEntityID,
  ): Promise<PaymentDetailEntity | null>;
}

export class PaymentDetailRepositoryImpl implements PaymentDetailRepository {
  constructor(
    private readonly db: Repository<PixDetailORMEntity>,
    private readonly paymentDetailMapper: PixDetailMapper,
  ) {}

  async save(detail: PaymentDetailEntity): Promise<void> {
    const orm = this.paymentDetailMapper.toORM(detail);
    if (orm.isFailure) throw orm.error;
    await this.db.save(orm.value);
  }

  async findByPaymentId(
    paymentId: UniqueEntityID,
  ): Promise<PaymentDetailEntity | null> {
    const orm = await this.db.findOneBy({ paymentId });
    if (!orm) return null;

    const domain = this.paymentDetailMapper.toDomain(orm);

    if (domain.isFailure) throw domain.error;
    return domain.value;
  }
}
