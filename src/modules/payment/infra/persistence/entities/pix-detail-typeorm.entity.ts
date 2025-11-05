import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { DefaultORMEntity } from '@core/infra/database/typeorm/default-orm.entity';
import { Column, Entity } from 'typeorm';

@Entity('pix_details')
export class PixDetailORMEntity extends DefaultORMEntity {
  @Column({
    type: 'varchar',
    length: 100,
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

  @Column({ type: 'varchar', length: 200, name: 'qr_code' })
  qrCode!: string;
}
