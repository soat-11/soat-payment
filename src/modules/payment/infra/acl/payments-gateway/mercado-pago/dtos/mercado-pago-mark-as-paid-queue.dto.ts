import { ProcessPaymentDTOSchemaRequest } from './process-payment.dto';

export type MercadoPagoMarkAsPaidQueueMessage = {
  paymentReference: string;
  webhookPayload: ProcessPaymentDTOSchemaRequest;
};

