import { DefaultMongoDBEntity } from '@core/infra/database/mongodb/default-mongodb.entity';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';

import { Column, Entity } from 'typeorm';

@Entity('payments')
export class PaymentMongoDBEntity extends DefaultMongoDBEntity {
  @Column({
    type: 'number',
  })
  amount!: number;

  @Column({
    type: 'string',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({
    type: 'string',
    enum: PaymentType,
  })
  type!: PaymentType;

  @Column({
    type: 'string',
    enum: PaymentProviders,
    nullable: true,
  })
  provider?: PaymentProviders | null;

  @Column({
    type: 'string',
    name: 'external_payment_id',
    nullable: true,
  })
  externalPaymentId: string | null;

  @Column({
    type: 'date',
    name: 'expires_at',
  })
  expiresAt!: Date;
}
