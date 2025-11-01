import { DomainEvent } from '../events/domain-event';
import { UniqueEntityID } from './value-objects/unique-entity-id.vo';

export abstract class AggregateRoot<T extends { id: UniqueEntityID }> {
  private _domainEvents: DomainEvent<T>[] = [];

  get domainEvents(): readonly DomainEvent<T>[] {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent<T>): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
