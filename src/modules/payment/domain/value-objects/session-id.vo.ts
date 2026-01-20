import { ValueObject } from '@core/domain/value-objects/value-object.vo';
import { SessionIdInvalidException } from '@payment/domain/exceptions/payment.exception';

export class SessionIdVO extends ValueObject<string> {
  protected validate(input: string): void {
    if (!input || input.trim() === '') {
      throw new SessionIdInvalidException(input);
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(input)) {
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
