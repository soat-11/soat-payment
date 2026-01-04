import { Column, ColumnOptions } from 'typeorm';

export function UtcDateColumn(options: ColumnOptions = {}): PropertyDecorator {
  return Column({
    ...options,
    transformer: {
      to: (value: Date) => (value ? new Date(value.toISOString()) : value),
      from: (value: Date) => value,
    },
  });
}
