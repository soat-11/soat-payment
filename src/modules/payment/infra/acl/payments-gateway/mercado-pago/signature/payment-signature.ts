export interface PaymentSignatureInput {
  xSignature: string;
  xRequestId: string;
  data: string;
}

export interface PaymentSignature {
  execute(params: PaymentSignatureInput): Promise<boolean>;
}

export const PaymentSignature = Symbol('PaymentSignature');

