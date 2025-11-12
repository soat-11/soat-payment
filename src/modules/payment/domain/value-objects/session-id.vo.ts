import { ValueObject } from '@core/domain/value-objects/value-object.vo';
import { validate as uuidValidate } from 'uuid';
import { SessionIdInvalidException } from '@payment/domain/exceptions/payment.exception';

export class SessionIdVO extends ValueObject<string> {
  protected validate(input: string): void {
    if (!input || input.trim() === '') {
      throw new SessionIdInvalidException(input);
    }

    if (!uuidValidate(input)) {
      throw new SessionIdInvalidException(input);
    }
  }

  static create(sessionId: string): SessionIdVO {
    return new SessionIdVO(sessionId);
  }

  toString(): string {
    return this.value;
  }
}
