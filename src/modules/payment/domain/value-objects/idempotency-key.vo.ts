import { ValueObject } from '@core/domain/value-objects/value-object.vo';
import { IdempotencyKeyInvalidException } from '@payment/domain/exceptions/payment.exception';
import { validate as uuidValidate } from 'uuid';

export class IdempotencyKeyVO extends ValueObject<string> {
  protected validate(input: string): void {
    if (!input || input.trim() === '') {
      throw new IdempotencyKeyInvalidException(input);
    }

    if (!uuidValidate(input)) {
      throw new IdempotencyKeyInvalidException(input);
    }
  }

  static create(value: string): IdempotencyKeyVO {
    return new IdempotencyKeyVO(value);
  }
}
