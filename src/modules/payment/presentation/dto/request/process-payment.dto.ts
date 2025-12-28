import { ApiProperty } from '@nestjs/swagger';

import { ProcessPaymentDTOSchemaRequest } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';

export class ProcessPaymentDto {
  @ApiProperty({
    example: 'ORD01JV3AW3NFSTSTB669F41NACDX',
    description: 'Referência do pagamento (Order ID do Mercado Pago)',
    type: 'string',
  })
  paymentReference: string;

  @ApiProperty({
    description: 'Payload do webhook de Order do Mercado Pago',
    type: () => ProcessPaymentDTOSchemaRequest,
  })
  webhookPayload: ProcessPaymentDTOSchemaRequest;
}
