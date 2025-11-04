import { DefaultEntity } from '@core/domain/default-entity';
import { DomainEvent } from '@core/events/domain-event';

export interface DomainEventHandler<T extends DomainEvent<DefaultEntity>> {
  handle(event: T): Promise<void>;
}
