import { DomainEvent } from '@core/events/domain-event';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';
import { DomainEventHandler } from '@core/events/domain-event-handler';

describe('DomainEventDispatcherImpl', () => {
  it('should register and retrieve handlers', () => {
    const eventMock = jest.fn();
    const eventDispatcher = DomainEventDispatcherImpl.getInstance();

    const eventHandler: DomainEventHandler<DomainEvent<string>> = {
      handle(event) {
        return Promise.resolve(eventMock(event));
      },
    };

    eventDispatcher.register('test-event', eventHandler);

    expect(eventDispatcher.getHandler('test-event')).toHaveLength(1);
  });

  it('Should notify when an event occured', () => {
    const eventDispatcher = DomainEventDispatcherImpl.getInstance();
    const eventHandlerMock = jest.fn();
    const eventHandler: DomainEventHandler<DomainEvent<string>> = {
      handle(event) {
        return Promise.resolve(eventHandlerMock(event));
      },
    };

    class TestEvent implements DomainEvent<string> {
      eventName: string;
      eventDate: Date;
      data: string;
      dateTimeOccurred: Date;

      constructor() {
        this.eventName = 'TestEvent';
        this.eventDate = new Date();
        this.data = 'Test data';
        this.dateTimeOccurred = new Date();
      }
    }

    eventDispatcher.register(TestEvent.name, eventHandler);

    const event: DomainEvent<string> = new TestEvent();

    eventDispatcher.dispatch(event);

    expect(eventHandlerMock).toHaveBeenCalled();
  });
});
