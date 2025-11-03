import { DomainEvent } from '../events/domain-event';
import { DefaultEntity } from './default-entity';

export abstract class AggregateRoot<
  T extends DefaultEntity,
> extends DefaultEntity {
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
