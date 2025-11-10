import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { UtcDateColumn } from '@payment/infra/persistence/datasource/utc-date-column.decorator';
import { ObjectId } from 'mongodb';
import {
  Column,
  CreateDateColumn,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class DefaultMongoDBEntity {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({
    type: 'string',
    unique: true,
    transformer: {
      to: (value: UniqueEntityID) => value.value,
      from: (value: string) => UniqueEntityID.create(value),
    },
  })
  id: UniqueEntityID;

  @UtcDateColumn({
    default: new Date(),
  })
  createdAt!: Date;

  @UtcDateColumn({
    default: new Date(),
  })
  updatedAt: Date;
}
