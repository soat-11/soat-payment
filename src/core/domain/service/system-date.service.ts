export interface SystemDateDomainService<T = Date> {
  now(): T;
  create(date: T | string): T;
  addMinutes(date: T, minutes: number): T;
}
