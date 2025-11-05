import { DefaultEntity } from '@core/domain/default-entity';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { DomainEvent } from '@core/events/domain-event';
import { DomainEventDispatcherImpl } from '@core/events/domain-event-dispatcher-impl';
import { DomainEventHandler } from '@core/events/domain-event-handler';

describe('DomainEventDispatcherImpl', () => {
  it('should register and retrieve handlers', () => {
    const eventMock = jest.fn();
    const eventDispatcher = new DomainEventDispatcherImpl();

    class TestEvent extends DefaultEntity {}

    const eventHandler: DomainEventHandler<DomainEvent<TestEvent>> = {
      handle(event) {
        return Promise.resolve(eventMock(event));
      },
    };

    eventDispatcher.register('test-event', eventHandler);

    expect(eventDispatcher.getHandler('test-event')).toHaveLength(1);
  });

  it('Should notify when an event occured', () => {
    const eventDispatcher = new DomainEventDispatcherImpl();
    const eventHandlerMock = jest.fn();
    class TestEntity extends DefaultEntity {
      static create(id: UniqueEntityID): TestEntity {
        return new TestEntity(id);
      }
    }
    const eventHandler: DomainEventHandler<DomainEvent<TestEntity>> = {
      handle(event) {
        return Promise.resolve(eventHandlerMock(event));
      },
    };

    class TestEvent implements DomainEvent<TestEntity> {
      eventName: string;
      eventDate: Date;
      data: TestEntity;
      dateTimeOccurred: Date;

      constructor() {
        this.eventName = 'TestEvent';
        this.eventDate = new Date();
        this.data = TestEntity.create(UniqueEntityID.create());
        this.dateTimeOccurred = new Date();
      }
    }

    eventDispatcher.register(TestEvent.name, eventHandler);

    const event: DomainEvent<TestEntity> = new TestEvent();

    eventDispatcher.dispatch(event);

    expect(eventHandlerMock).toHaveBeenCalled();
  });
});
