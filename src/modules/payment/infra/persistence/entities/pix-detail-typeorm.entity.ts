import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { DefaultORMEntity } from '@core/infra/database/typeorm/default-orm.entity';
import { Column } from 'typeorm';

export class PixDetailORMEntity extends DefaultORMEntity {
  @Column({
    type: 'string',
    unique: true,
    primary: true,
    name: 'payment_id',
    foreignKeyConstraintName: 'payment_detail_payment_id_fk',
    transformer: {
      to: (value: UniqueEntityID) => value.value,
      from: (value: string) => UniqueEntityID.create(value),
    },
  })
  paymentId!: UniqueEntityID;

  @Column({ type: 'string', name: 'qr_code' })
  qrCode!: string;
}
