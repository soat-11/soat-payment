import { SystemDateDomainService } from './system-date.service';

export class SystemDateImpl implements SystemDateDomainService {
  constructor(private date: Date) {}

  now(): Date {
    return this.date;
  }

  create(date: Date): Date {
    return new Date(date);
  }

  setDate(date: Date): void {
    this.date = date;
  }

  addMinutes(date: Date, minutes: number): Date {
    const newDate = new Date(date);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return newDate;
  }
}
