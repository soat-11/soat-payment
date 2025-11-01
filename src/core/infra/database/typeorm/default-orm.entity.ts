import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class DefaultORMEntity {
  @Column({
    type: 'varchar',
    unique: true,
    primary: true,
    transformer: {
      to: (value: UniqueEntityID) => value.value,
      from: (value: string) => UniqueEntityID.create(value),
    },
  })
  id: UniqueEntityID;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
