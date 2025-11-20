import { Result } from '@core/domain/result';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';

export type PixCreatePaymentItemType = {
  title: string;
  unitPrice: number;
  quantity: number;
};

export type PixCreatePaymentType = {
  amount: number;
  expirationTime: Date;
  externalReference: string;
  idempotencyKey: string;
  items: PixCreatePaymentItemType[];
  type: PaymentType;
};

export type AnyCreatePaymentType = PixCreatePaymentType;

export const isPixCreatePaymentType = (
  payment: AnyCreatePaymentType,
): payment is PixCreatePaymentType => {
  return payment.type === PaymentType.PIX;
};

export type PixCreatePaymentResponseType = {
  qrCode: string;
};

export type CreateAnyPaymentResponse = PixCreatePaymentResponseType;

export interface CreatePaymentGateway {
  createPayment(
    payment: AnyCreatePaymentType,
  ): Promise<Result<CreateAnyPaymentResponse>>;
}
