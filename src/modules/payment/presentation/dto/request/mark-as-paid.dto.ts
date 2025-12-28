import { ApiProperty } from '@nestjs/swagger';

import { ProcessPaymentDTOSchemaRequest } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';

export class MarkAsPaidDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Referência do pagamento (idempotency key)',
    type: 'string',
    format: 'uuid',
  })
  paymentReference: string;

  @ApiProperty({
    description: 'Payload do webhook do Mercado Pago',
    type: () => ProcessPaymentDTOSchemaRequest,
  })
  webhookPayload: ProcessPaymentDTOSchemaRequest;
}

