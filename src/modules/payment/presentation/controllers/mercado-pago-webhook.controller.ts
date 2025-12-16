import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProcessPaymentDTOSchemaRequest } from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';
import { SqsMercadoPagoProcessPaymentPublish } from '@payment/infra/acl/payments-gateway/mercado-pago/publishers/mercado-pago-mark-as-paid.publish';
import {
  PaymentSignature,
  PaymentSignature as PaymentSignatureType,
} from '@payment/infra/acl/payments-gateway/mercado-pago/signature/payment-signature';

@ApiTags('Webhooks')
@Controller('webhooks/mercado-pago')
export class MercadoPagoWebhookController {
  constructor(
    @Inject(SqsMercadoPagoProcessPaymentPublish)
    private readonly processPaymentPublish: SqsMercadoPagoProcessPaymentPublish,
    @Inject(PaymentSignature)
    private readonly signature: PaymentSignatureType,
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
  @ApiHeader({
    name: 'x-signature',
    description: 'Assinatura HMAC do Mercado Pago para validação',
    required: false,
  })
  @ApiHeader({
    name: 'x-request-id',
    description: 'ID da requisição do Mercado Pago',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook recebido e enfileirado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Assinatura inválida',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro ao enfileirar a mensagem',
  })
  async handleWebhook(
    @Query('data.id') dataId: string,
    @Query('type') type: string,
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
    @Body() body: ProcessPaymentDTOSchemaRequest,
  ): Promise<{ success: boolean }> {
    this.logger.log('Processing Mercado Pago webhook', {
      payload: JSON.stringify({ dataId, type, body }),
    });
    const paymentReference = dataId || body?.data?.id;

    this.logger.log('Payment reference', {
      paymentReference,
    });

    const isValid = await this.signature.execute({
      xSignature,
      xRequestId,
      data: paymentReference || '',
    });

    if (!isValid) {
      this.logger.warn('Invalid webhook signature', {
        paymentReference,
        xRequestId,
      });
      throw new BadRequestException('Invalid signature');
    }

    this.logger.log('Webhook signature validated successfully', {
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

    await this.processPaymentPublish.publish({
      paymentReference,
      webhookPayload: {
        ...body,
        action: body?.action,
        data: {
          ...body?.data,
          id: body?.data?.id || paymentReference,
        },
        type: body?.type || type,
      },
    });

    return { success: true };
  }
}
