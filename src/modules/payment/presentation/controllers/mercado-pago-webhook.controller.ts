import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProcessPaymentDTOSchemaRequest } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';
import { SqsMercadoPagoMarkAsPaidPublish } from '@payment/infra/acl/payments-gateway/mercado-pago/publishers/mercado-pago-mark-as-paid.publish';

@ApiTags('Webhooks')
@Controller('webhooks/mercado-pago')
export class MercadoPagoWebhookController {
  constructor(
    @Inject(SqsMercadoPagoMarkAsPaidPublish)
    private readonly markAsPaidPublish: SqsMercadoPagoMarkAsPaidPublish,
    private readonly logger: AbstractLoggerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Processa webhook de pagamento do Mercado Pago',
    description:
      'Endpoint para receber notificações de pagamento do Mercado Pago. ' +
      'A mensagem é validada e enviada para uma fila SQS para processamento assíncrono.',
  })
  @ApiQuery({
    name: 'data.id',
    description: 'ID do pagamento (enviado pelo Mercado Pago)',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'type',
    description: 'Tipo do evento (ex: payment, order)',
    required: false,
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
    @Query('data.id') dataId: string,
    @Query('type') type: string,
    @Body() body: ProcessPaymentDTOSchemaRequest,
  ): Promise<{ success: boolean }> {
    this.logger.log('Processing Mercado Pago webhook', {
      payload: JSON.stringify({ dataId, type, body }),
    });
    const paymentReference = dataId || body?.data?.id;

    this.logger.log('Payment reference', {
      paymentReference,
    });

    if (!paymentReference) {
      this.logger.log('No payment reference found', {
        dataId,
        type,
        body,
      });
      return { success: true };
    }

    await this.markAsPaidPublish.publish({
      paymentReference,
      webhookPayload: {
        ...body,
        action: body?.action,
        data: { id: paymentReference },
        type: body?.type || type,
      },
    });

    return { success: true };
  }
}
