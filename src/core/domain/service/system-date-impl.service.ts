import { SystemDateDomainService } from './system-date.service';

export class SystemDateImpl implements SystemDateDomainService {
  private fixedDate: Date | null = null;

  constructor(date?: Date) {
    if (date) {
      this.fixedDate = SystemDateImpl.toUTC(date);
    }
  }

  static toUTC(date: Date): Date {
    return new Date(date.toISOString());
  }

  static nowUTC(): Date {
    return new Date(new Date().toISOString());
  }
  nowUTC(): Date {
    return new Date(new Date().toISOString());
  }

  now(): Date {
    return this.fixedDate ?? SystemDateImpl.nowUTC();
  }

  create(date: Date | string): Date {
    if (typeof date === 'string') {
      return new Date(date);
    }
    return SystemDateImpl.toUTC(date);
  }

  setDate(date: Date): void {
    this.fixedDate = SystemDateImpl.toUTC(date);
  }

  addMinutes(date: Date, minutes: number): Date {
    const newDate = new Date(date.getTime());
    newDate.setUTCMinutes(newDate.getUTCMinutes() + minutes);
    return newDate;
  }
}
