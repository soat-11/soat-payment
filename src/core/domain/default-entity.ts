import { UniqueEntityID } from './value-objects/unique-entity-id.vo';

export abstract class DefaultEntity {
  public readonly createdAt: Date = new Date();
  public readonly updatedAt: Date = new Date();
  public readonly deletedAt: Date | null = null;

  constructor(protected readonly id: UniqueEntityID) {}
}
