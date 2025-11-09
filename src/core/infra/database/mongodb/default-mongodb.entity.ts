import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
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

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt: Date;
}
