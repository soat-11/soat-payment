import { DefaultEntity } from '@core/domain/default-entity';

export abstract class DomainEvent<T extends DefaultEntity> {
  readonly eventDate: Date;
  readonly data: T;
  readonly dateTimeOccurred: Date;

  protected constructor(data: T) {
    this.eventDate = new Date();
    this.data = data;
    this.dateTimeOccurred = new Date();
  }

  static get eventName(): string {
    return this.name;
  }

  get eventName(): string {
    return (this.constructor as typeof DomainEvent).eventName;
  }
}
