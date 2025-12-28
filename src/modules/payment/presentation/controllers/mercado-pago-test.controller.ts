import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import {
  MercadoPagoOrderAction,
  MercadoPagoOrderStatus,
  MercadoPagoOrderType,
  MercadoPagoStatusDetail,
} from '@payment/infra/acl/payments-gateway/mercado-pago/dtos/process-payment.dto';
import { SqsMercadoPagoProcessPaymentPublish } from '@payment/infra/acl/payments-gateway/mercado-pago/publishers/mercado-pago-mark-as-paid.publish';

class SimulateWebhookRequestDto {
  @ApiProperty({
    description: 'ID da ordem do Mercado Pago',
    example: 'ORD01JV3AW3NFSTSTB669F41NACDX',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Referência externa (seu ID interno)',
    example: 'ext_ref_1234',
  })
  @IsString()
  @IsNotEmpty()
  externalReference: string;

  @ApiProperty({
    description: 'Valor total (em centavos)',
    example: 100000,
  })
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @ApiProperty({
    description: 'Tipo da ordem',
    enum: MercadoPagoOrderType,
    example: MercadoPagoOrderType.QR,
    required: false,
  })
  @IsEnum(MercadoPagoOrderType)
  @IsOptional()
  orderType?: MercadoPagoOrderType;

  @ApiProperty({
    description: 'Application ID do Mercado Pago',
    example: '7364289770550796',
    required: false,
  })
  @IsString()
  @IsOptional()
  applicationId?: string;

  @ApiProperty({
    description: 'User ID do Mercado Pago',
    example: 1403498245,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  userId?: number;
}

class SimulateWebhookResponseDto {
  @ApiProperty({ description: 'Sucesso do envio' })
  success: boolean;

  @ApiProperty({ description: 'Mensagem' })
  message: string;

  @ApiProperty({ description: 'Ação simulada' })
  action: string;

  @ApiProperty({ description: 'ID da ordem' })
  orderId: string;
}

@ApiTags('Mercado Pago - Simular Webhooks')
@Controller('test/mercado-pago/webhook')
export class MercadoPagoTestController {
  constructor(
    @Inject(SqsMercadoPagoProcessPaymentPublish)
    private readonly processPaymentPublish: SqsMercadoPagoProcessPaymentPublish,
    private readonly logger: AbstractLoggerService,
  ) {}

  private buildWebhookPayload(
    action: MercadoPagoOrderAction,
    status: MercadoPagoOrderStatus,
    statusDetail: MercadoPagoStatusDetail,
    dto: SimulateWebhookRequestDto,
    includeTransactions: boolean = false,
  ) {
    const basePayload = {
      action,
      api_version: 'v1',
      application_id: dto.applicationId || '7364289770550796',
      date_created: new Date().toISOString(),
      live_mode: false,
      type: 'order',
      user_id: dto.userId || 1403498245,
      data: {
        external_reference: dto.externalReference,
        id: dto.orderId,
        status,
        status_detail: statusDetail,
        total_amount: dto.totalAmount || 3000,
        type: dto.orderType || MercadoPagoOrderType.QR,
        version: 2,
        ...(includeTransactions && {
          total_paid_amount: dto.totalAmount || 3000,
          transactions: {
            payments: [
              {
                amount: dto.totalAmount || 3000,
                id: `PAY${uuidv4().replace(/-/g, '').substring(0, 20).toUpperCase()}`,
                paid_amount: dto.totalAmount || 3000,
                payment_method: {
                  id: 'account_money',
                  installments: 1,
                  type: 'account_money',
                },
                reference: {
                  id: Math.floor(Math.random() * 100000000000),
                },
                status: 'processed',
                status_detail: 'accredited',
              },
            ],
          },
        }),
      },
    };

    return basePayload;
  }

  @Post('processed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simula webhook de pagamento PROCESSADO (order.processed)',
    description:
      'Simula o envio de um webhook do Mercado Pago informando que o pagamento foi processado com sucesso.',
  })
  @ApiBody({ type: SimulateWebhookRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook simulado com sucesso',
    type: SimulateWebhookResponseDto,
  })
  async simulateProcessed(
    @Body() dto: SimulateWebhookRequestDto,
  ): Promise<SimulateWebhookResponseDto> {
    const webhookPayload = this.buildWebhookPayload(
      MercadoPagoOrderAction.PROCESSED,
      MercadoPagoOrderStatus.PROCESSED,
      MercadoPagoStatusDetail.ACCREDITED,
      dto,
      true, // incluir transactions
    );

    this.logger.log('Test: Simulating PROCESSED webhook', {
      orderId: dto.orderId,
      payload: JSON.stringify(webhookPayload),
    });

    await this.processPaymentPublish.publish({
      paymentReference: dto.orderId,
      webhookPayload,
    });

    return {
      success: true,
      message: 'Webhook de pagamento processado enviado para a fila',
      action: MercadoPagoOrderAction.PROCESSED,
      orderId: dto.orderId,
    };
  }

  @Post('canceled')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simula webhook de pagamento CANCELADO (order.canceled)',
    description:
      'Simula o envio de um webhook do Mercado Pago informando que o pagamento foi cancelado.',
  })
  @ApiBody({ type: SimulateWebhookRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook simulado com sucesso',
    type: SimulateWebhookResponseDto,
  })
  async simulateCanceled(
    @Body() dto: SimulateWebhookRequestDto,
  ): Promise<SimulateWebhookResponseDto> {
    const webhookPayload = this.buildWebhookPayload(
      MercadoPagoOrderAction.CANCELED,
      MercadoPagoOrderStatus.CANCELED,
      MercadoPagoStatusDetail.CANCELED,
      dto,
      false,
    );

    this.logger.log('Test: Simulating CANCELED webhook', {
      orderId: dto.orderId,
      payload: JSON.stringify(webhookPayload),
    });

    await this.processPaymentPublish.publish({
      paymentReference: dto.orderId,
      webhookPayload,
    });

    return {
      success: true,
      message: 'Webhook de pagamento cancelado enviado para a fila',
      action: MercadoPagoOrderAction.CANCELED,
      orderId: dto.orderId,
    };
  }

  @Post('refunded')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simula webhook de pagamento REEMBOLSADO (order.refunded)',
    description:
      'Simula o envio de um webhook do Mercado Pago informando que o pagamento foi reembolsado.',
  })
  @ApiBody({ type: SimulateWebhookRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook simulado com sucesso',
    type: SimulateWebhookResponseDto,
  })
  async simulateRefunded(
    @Body() dto: SimulateWebhookRequestDto,
  ): Promise<SimulateWebhookResponseDto> {
    const webhookPayload = this.buildWebhookPayload(
      MercadoPagoOrderAction.REFUNDED,
      MercadoPagoOrderStatus.REFUNDED,
      MercadoPagoStatusDetail.REFUNDED,
      dto,
      false,
    );
    // Refunded inclui total_paid_amount
    webhookPayload.data['total_paid_amount'] = dto.totalAmount || 3000;
    webhookPayload.data['version'] = 3;

    this.logger.log('Test: Simulating REFUNDED webhook', {
      orderId: dto.orderId,
      payload: JSON.stringify(webhookPayload),
    });

    await this.processPaymentPublish.publish({
      paymentReference: dto.orderId,
      webhookPayload,
    });

    return {
      success: true,
      message: 'Webhook de pagamento reembolsado enviado para a fila',
      action: MercadoPagoOrderAction.REFUNDED,
      orderId: dto.orderId,
    };
  }

  @Post('expired')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simula webhook de pagamento EXPIRADO (order.expired)',
    description:
      'Simula o envio de um webhook do Mercado Pago informando que o pagamento expirou.',
  })
  @ApiBody({ type: SimulateWebhookRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook simulado com sucesso',
    type: SimulateWebhookResponseDto,
  })
  async simulateExpired(
    @Body() dto: SimulateWebhookRequestDto,
  ): Promise<SimulateWebhookResponseDto> {
    const webhookPayload = this.buildWebhookPayload(
      MercadoPagoOrderAction.EXPIRED,
      MercadoPagoOrderStatus.EXPIRED,
      MercadoPagoStatusDetail.EXPIRED,
      dto,
      false,
    );

    this.logger.log('Test: Simulating EXPIRED webhook', {
      orderId: dto.orderId,
      payload: JSON.stringify(webhookPayload),
    });

    await this.processPaymentPublish.publish({
      paymentReference: dto.orderId,
      webhookPayload,
    });

    return {
      success: true,
      message: 'Webhook de pagamento expirado enviado para a fila',
      action: MercadoPagoOrderAction.EXPIRED,
      orderId: dto.orderId,
    };
  }
}
