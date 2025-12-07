import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { MarkAsPaidGateway } from '@payment/domain/gateways/mark-as-paid';
import { ProcessPaymentDTOSchemaRequest } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';

@ApiTags('Webhooks')
@Controller('webhooks/mercado-pago')
export class MercadoPagoWebhookController {
  constructor(
    @Inject('MarkAsPaidGateway')
    private readonly markAsPaidGateway: MarkAsPaidGateway<ProcessPaymentDTOSchemaRequest>,
  ) {}

  @Post(':paymentReference')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook Mercado Pago',
    description: `
## Descrição
Endpoint que recebe notificações de webhook do Mercado Pago.

Quando um pagamento é confirmado, o Mercado Pago envia uma notificação para este endpoint.
A notificação é então enviada como signal para o workflow Temporal correspondente.

## Fluxo
1. Mercado Pago envia webhook com \`action: payment.created\`
2. Este endpoint valida e envia signal direto para o Temporal Workflow
3. Workflow acorda e executa activity \`markPaymentAsPaid\`
4. Activity marca pagamento como pago e dispara eventos de domínio

## Configuração no Mercado Pago
Configure a URL de webhook no painel do Mercado Pago:
\`\`\`
https://seu-dominio.com/webhooks/mercado-pago/{external_reference}
\`\`\`

O \`external_reference\` corresponde ao \`idempotencyKey\` do pagamento.
    `,
  })
  @ApiParam({
    name: 'paymentReference',
    description: 'External reference (idempotencyKey) do pagamento',
    example: 'session-abc-123',
  })
  @ApiBody({ type: ProcessPaymentDTOSchemaRequest })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Ação inválida ou payload malformado',
  })
  async handleWebhook(
    @Param('paymentReference') paymentReference: string,
    @Body() body: ProcessPaymentDTOSchemaRequest,
  ): Promise<{ status: string }> {
    const result = await this.markAsPaidGateway.markAsPaid(
      paymentReference,
      body,
    );

    if (result.isFailure) {
      // Return 200 anyway to prevent Mercado Pago from retrying
      // The error is logged in the gateway
      return { status: 'received' };
    }

    return { status: 'ok' };
  }
}
