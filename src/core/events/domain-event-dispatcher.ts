import { DefaultEntity } from '@core/domain/default-entity';
import { DomainEvent } from '@core/events/domain-event';
import { DomainEventHandler } from '@core/events/domain-event-handler';

export interface DomainEventDispatcher {
  dispatch<T extends DefaultEntity>(event: DomainEvent<T>): Promise<void>;
  register<T extends DefaultEntity>(
    eventName: string,
    handler: DomainEventHandler<DomainEvent<T>>,
  ): void;
  getHandler<T extends DefaultEntity>(
    eventName: string,
  ): Array<(event: DomainEvent<T>) => void>;
}
