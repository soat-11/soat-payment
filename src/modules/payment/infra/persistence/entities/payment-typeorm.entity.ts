import { DefaultORMEntity } from '@core/infra/database/typeorm/default-orm.entity';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';

import { Column, Entity } from 'typeorm';

@Entity('payments')
export class PaymentTypeORMEntity extends DefaultORMEntity {
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount!: number;

  @Column({
    enum: PaymentStatus,
    enumName: 'payment_status_enum',
    type: process.env.NODE_ENV === 'test' ? 'simple-enum' : 'enum',
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({
    enum: PaymentType,
    enumName: 'payment_type_enum',
    type: process.env.NODE_ENV === 'test' ? 'simple-enum' : 'enum',
  })
  type!: PaymentType;

  @Column({
    enum: PaymentProviders,
    enumName: 'payment_provider_enum',
    type: process.env.NODE_ENV === 'test' ? 'simple-enum' : 'enum',
    nullable: true,
  })
  provider?: PaymentProviders | null;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'external_payment_id',
    nullable: true,
  })
  externalPaymentId: string | null;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz',
    name: 'expires_at',
  })
  expiresAt!: Date;
}
