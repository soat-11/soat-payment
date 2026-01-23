import { Result } from '@core/domain/result';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { SessionIdVO } from '@payment/domain/value-objects/session-id.vo';

export interface PaymentDetailsOutput {
  id: string;
  status: PaymentStatus;
  amount: number;
  type: PaymentType;
  expiresAt: Date;
  externalPaymentId: string | null;
}

export interface GetPaymentDetailsBySessionIdUseCase {
  execute(sessionId: SessionIdVO): Promise<Result<PaymentDetailsOutput>>;
}

export const GetPaymentDetailsBySessionIdUseCase = Symbol(
  'GetPaymentDetailsBySessionIdUseCase',
);
