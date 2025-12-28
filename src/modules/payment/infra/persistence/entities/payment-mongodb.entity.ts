import { Column, Entity } from 'typeorm';

import { DefaultMongoDBEntity } from '@core/infra/database/mongodb/default-mongodb.entity';
import { UtcDateColumn } from '@modules/payment/infra/persistence/datasource/utc-date-column.decorator';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';


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
    nullable: true,
  })
  externalPaymentId: string | null;

  @Column({
    type: 'string',
    unique: true,
  })
  idempotencyKey!: string;

  @Column({
    type: 'string',
  })
  sessionId!: string;

  @UtcDateColumn()
  expiresAt: Date;

  @UtcDateColumn({
    nullable: true,
  })
  canceledAt: Date | null;
}
