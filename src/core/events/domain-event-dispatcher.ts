import { DomainEvent } from '@core/events/domain-event';
import { DomainEventHandler } from '@core/events/domain-event-handler';

export interface DomainEventDispatcher {
  dispatch<T>(event: DomainEvent<T>): void;
  register<T>(
    eventName: string,
    handler: DomainEventHandler<DomainEvent<T>>,
  ): void;
  getHandler<T>(eventName: string): Array<(event: DomainEvent<T>) => void>;
}
