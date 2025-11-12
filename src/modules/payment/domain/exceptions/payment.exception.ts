import {
  DomainBusinessException,
  DomainConflictException,
} from '@core/domain/exceptions/domain.exception';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';

export class PaymentDetailInvalidException extends DomainBusinessException {
  constructor(expectedType: PaymentType, receivedType: PaymentType) {
    super(
      `Tipo de detalhe inválido: esperado ${expectedType}, recebido ${receivedType}`,
    );
  }
}

export class PaymentProviderNotProvidedException extends DomainBusinessException {
  constructor() {
    super(
      'Provedor de pagamento não informado, é obrigatório para pagar um pagamento',
    );
  }
}

export class PaymentStatusInvalidException extends DomainBusinessException {
  constructor(receivedStatus: PaymentStatus) {
    super(`Status de pagamento inválido: ${receivedStatus}`);
  }
}

export class PaymentProviderInvalidException extends DomainBusinessException {
  constructor(receivedProvider: PaymentProviders) {
    super(`Provedor de pagamento inválido: ${receivedProvider}`);
  }
}
export class PaymentAlreadyPaidException extends DomainBusinessException {
  constructor() {
    super('Pagamento já está como PAGO');
  }
}

export class PaymentTypeInvalidException extends DomainBusinessException {
  constructor(receivedType: PaymentType) {
    super(`Tipo de pagamento inválido: ${receivedType}`);
  }
}

export class PaymentExpiredException extends DomainBusinessException {
  constructor() {
    super('Não é possível pagar um pagamento expirado, o pagamento expirou');
  }
}

export class PaymentAmountInvalidException extends DomainBusinessException {
  constructor(value: number) {
    super(`Valor do pagamento inválido: ${value}`);
  }
}

export class PaymentExternalPaymentIdRequiredException extends DomainBusinessException {
  constructor(externalPaymentId: string) {
    super(`ID externo do pagamento é obrigatório: ${externalPaymentId}`);
  }
}

export class PixDetailInvalidException extends DomainBusinessException {
  constructor() {
    super('Detalhe de pagamento inválido para PIX');
  }
}

export class IdempotencyKeyInvalidException extends DomainBusinessException {
  constructor(value: string) {
    super(`Chave idempotente inválida: ${value}`);
  }
}

export class SessionIdInvalidException extends DomainBusinessException {
  constructor(value: string) {
    super(`Session ID inválido: ${value}`);
  }
}

export class PaymentAlreadyExistsException extends DomainConflictException {
  constructor() {
    super('Pagamento já existe');
  }
}
