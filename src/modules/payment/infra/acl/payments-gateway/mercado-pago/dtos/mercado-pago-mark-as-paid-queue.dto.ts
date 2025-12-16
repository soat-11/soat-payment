import { ProcessPaymentDTOSchemaRequest } from './process-payment.dto';

export type MercadoPagoProcessPaymentQueueMessage = {
  paymentReference: string;
  webhookPayload: ProcessPaymentDTOSchemaRequest;
};
