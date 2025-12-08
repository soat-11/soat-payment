import { SystemDateDomainService } from './system-date.service';

export class SystemDateImpl implements SystemDateDomainService {
  private fixedDate: Date | null = null;

  constructor(date?: Date) {
    // Se uma data for passada, usa como data fixa (para testes)
    // Se não, now() retornará sempre a data atual UTC
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

  now(): Date {
    // Se tem data fixa (modo teste), retorna ela
    // Senão, retorna a data atual UTC
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
