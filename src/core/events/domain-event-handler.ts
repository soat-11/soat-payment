import { DomainEvent } from '@core/events/domain-event';

export interface DomainEventHandler<T extends DomainEvent<unknown>> {
  handle(event: T): Promise<void>;
}
