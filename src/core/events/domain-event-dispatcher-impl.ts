import { DomainEvent } from '@core/events/domain-event';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { DomainEventHandler } from '@core/events/domain-event-handler';

export class DomainEventDispatcherImpl implements DomainEventDispatcher {
  private static instance: DomainEventDispatcherImpl;

  private handlers: Map<string, Array<(event: DomainEvent<unknown>) => void>> =
    new Map();

  private constructor() {}

  static getInstance(): DomainEventDispatcherImpl {
    if (!DomainEventDispatcherImpl.instance) {
      DomainEventDispatcherImpl.instance = new DomainEventDispatcherImpl();
    }
    return DomainEventDispatcherImpl.instance;
  }

  register<T>(
    eventName: string,
    handler: DomainEventHandler<DomainEvent<T>>,
  ): void {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.push(handler.handle.bind(handler));
    this.handlers.set(eventName, handlers);
  }

  dispatch<T>(event: DomainEvent<T>): void {
    const handlers = this.handlers.get(event.eventName);
    if (!handlers) return;

    handlers.forEach((handler) => handler(event));
  }

  getHandler<T>(eventName: string): Array<(event: DomainEvent<T>) => void> {
    const handlers = this.handlers.get(eventName);
    if (!handlers) {
      return [];
    }
    return handlers as Array<(event: DomainEvent<T>) => void>;
  }
}
