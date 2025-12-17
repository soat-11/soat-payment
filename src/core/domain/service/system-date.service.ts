export interface SystemDateDomainService<T = Date> {
  now(): T;
  nowUTC(): T;
  create(date: T | string): T;
  addMinutes(date: T, minutes: number): T;
}

export const SystemDateDomainService = Symbol('SystemDateDomainService');
