export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class DomainNotFoundException extends DomainException {}
export class DomainValidationException extends DomainException {}
export class DomainConflictException extends DomainException {}
export class DomainUnauthorizedException extends DomainException {}
export class DomainForbiddenException extends DomainException {}
export class DomainBusinessException extends DomainException {}
export class DomainPersistenceException extends DomainException {}
export class DomainExceptionGeneric extends DomainException {}
