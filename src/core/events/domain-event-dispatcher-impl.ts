import { DefaultEntity } from '@core/domain/default-entity';
import { DomainEvent } from '@core/events/domain-event';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { DomainEventHandler } from '@core/events/domain-event-handler';

export class DomainEventDispatcherImpl implements DomainEventDispatcher {
  private handlers: Map<
    string,
    Array<(event: DomainEvent<DefaultEntity>) => void>
  > = new Map();

  register<T extends DefaultEntity>(
    eventName: string,
    handler: DomainEventHandler<DomainEvent<T>>,
  ): void {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.push(handler.handle.bind(handler));
    this.handlers.set(eventName, handlers);
  }

  dispatch<T extends DefaultEntity>(event: DomainEvent<T>): void {
    const handlers = this.handlers.get(event.eventName);
    if (!handlers) return;

    handlers.forEach((handler) => handler(event));
  }

  getHandler<T extends DefaultEntity>(
    eventName: string,
  ): Array<(event: DomainEvent<T>) => void> {
    const handlers = this.handlers.get(eventName);
    if (!handlers) {
      return [];
    }
    return handlers as Array<(event: DomainEvent<T>) => void>;
  }
}
