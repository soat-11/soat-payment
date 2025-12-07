import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProcessPaymentDTOSchemaRequest } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';
import { SqsMercadoPagoMarkAsPaidPublish } from '@payment/infra/acl/payments-gateway/mercado-pago/publishers/mercado-pago-mark-as-paid.publish';

@ApiTags('Webhooks')
@Controller('webhooks/mercado-pago')
export class MercadoPagoWebhookController {
  constructor(
    @Inject(SqsMercadoPagoMarkAsPaidPublish)
    private readonly markAsPaidPublish: SqsMercadoPagoMarkAsPaidPublish,
  ) {}

  @Post(':paymentReference')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Processa webhook de pagamento do Mercado Pago',
    description:
      'Endpoint para receber notificações de pagamento do Mercado Pago. ' +
      'A mensagem é validada e enviada para uma fila SQS para processamento assíncrono.',
  })
  @ApiParam({
    name: 'paymentReference',
    description: 'Referência do pagamento (idempotency key)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook recebido e enfileirado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro ao enfileirar a mensagem',
  })
  async handleWebhook(
    @Param('paymentReference') paymentReference: string,
    @Body() body: ProcessPaymentDTOSchemaRequest,
  ): Promise<{ success: boolean }> {
    await this.markAsPaidPublish.publish({
      paymentReference,
      webhookPayload: body,
    });

    return { success: true };
  }
}
