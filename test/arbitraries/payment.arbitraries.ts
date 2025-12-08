import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import fc from 'fast-check';

export const paymentTypeArb = fc.constantFrom(...Object.values(PaymentType));

/**
 * Arbitrary para todos os status de pagamento
 */
export const paymentStatusArb = fc.constantFrom(
  ...Object.values(PaymentStatus),
);

/**
 * Arbitrary para status que podem ser cancelados
 */
export const cancellableStatusArb = fc.constantFrom(
  PaymentStatus.PENDING,
  PaymentStatus.PAID,
  PaymentStatus.REFUNDED,
);

/**
 * Arbitrary para provedores de pagamento
 */
export const paymentProviderArb = fc.constantFrom(
  ...Object.values(PaymentProviders),
);

/**
 * Arbitrary para valores de pagamento válidos (em centavos)
 * Min: 1 centavo, Max: 1 bilhão (R$ 10.000.000,00)
 */
export const validAmountArb = fc.integer({ min: 1, max: 1_000_000_000 });

/**
 * Arbitrary para valores de pagamento inválidos
 */
export const invalidAmountArb = fc.integer({ max: 0 });

/**
 * Arbitrary para datas futuras (até 1 ano) - Sempre em UTC
 */
export const futureDateArb = fc.date({
  min: SystemDateImpl.nowUTC(),
  max: new Date(SystemDateImpl.nowUTC().getTime() + 1000 * 60 * 60 * 24 * 365),
});

/**
 * Arbitrary para datas passadas (desde 2020) - Sempre em UTC
 */
export const pastDateArb = fc.date({
  min: new Date('2020-01-01T00:00:00.000Z'),
  max: SystemDateImpl.nowUTC(),
});

/**
 * Arbitrary para UUID válido
 */
export const uuidArb = fc.uuid();

/**
 * Arbitrary para strings que NÃO são UUIDs válidos
 */
export const invalidUuidArb = fc.string().filter((s) => !isValidUUID(s));

/**
 * Arbitrary para QR Code (string base64-like)
 */
export const qrCodeArb = fc.string({ minLength: 10, maxLength: 500 });

/**
 * Arbitrary para external payment ID
 */
export const externalPaymentIdArb = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Arbitrary para props de criação de Payment
 */
export const paymentCreatePropsArb = fc.record({
  amount: validAmountArb,
  type: paymentTypeArb,
  idempotencyKey: uuidArb,
  sessionId: uuidArb,
  expiresAt: futureDateArb,
});

/**
 * Arbitrary para props de Payment persistido
 */
export const paymentPersistedPropsArb = fc.record({
  amount: validAmountArb,
  type: paymentTypeArb,
  status: paymentStatusArb,
  idempotencyKey: uuidArb,
  sessionId: uuidArb,
  expiresAt: futureDateArb,
});

/**
 * Arbitrary para PaymentProvider props
 */
export const paymentProviderPropsArb = fc.record({
  provider: paymentProviderArb,
  externalPaymentId: externalPaymentIdArb,
});

function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
