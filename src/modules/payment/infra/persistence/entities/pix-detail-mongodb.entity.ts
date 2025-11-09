import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { DefaultMongoDBEntity } from '@core/infra/database/mongodb/default-mongodb.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('pix_details')
@Index(['paymentId'], { unique: true })
export class PixDetailMongoDBEntity extends DefaultMongoDBEntity {
  @Column({
    type: 'string',
    transformer: {
      to: (value: UniqueEntityID) => value.value,
      from: (value: string) => UniqueEntityID.create(value),
    },
  })
  paymentId!: UniqueEntityID;

  @Column({
    type: 'string',
  })
  qrCode!: string;
}
