import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum MercadoPagoOrderAction {
  PROCESSED = 'order.processed',
  REFUNDED = 'order.refunded',
  CANCELED = 'order.canceled',
  EXPIRED = 'order.expired',
}

export enum MercadoPagoOrderStatus {
  PROCESSED = 'processed',
  REFUNDED = 'refunded',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

export enum MercadoPagoStatusDetail {
  ACCREDITED = 'accredited',
  REFUNDED = 'refunded',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

export enum MercadoPagoOrderType {
  QR = 'qr',
  POINT = 'point',
}

class PaymentMethodDTO {
  @ApiProperty({ description: 'Payment method ID', example: 'visa' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Number of installments', example: 1 })
  @IsOptional()
  installments?: number;

  @ApiProperty({ description: 'Payment method type', example: 'credit_card' })
  @IsString()
  @IsOptional()
  type?: string;
}

class PaymentReferenceDTO {
  @ApiProperty({
    description: 'Reference ID (pode ser string ou number)',
    example: 1234567891,
  })
  @IsOptional()
  id?: string | number;
}

class PaymentTransactionDTO {
  @ApiProperty({
    description: 'Payment amount (centavos)',
    example: 100000,
  })
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: 'Payment ID',
    example: 'PAY01K7S9596QBWZRTY02NF',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Paid amount (centavos)',
    example: 100000,
  })
  @IsOptional()
  paid_amount?: number;

  @ApiProperty({ description: 'Payment method details' })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodDTO)
  payment_method?: PaymentMethodDTO;

  @ApiProperty({ description: 'Payment reference' })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentReferenceDTO)
  reference?: PaymentReferenceDTO;

  @ApiProperty({ description: 'Payment status', example: 'processed' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Payment status detail', example: 'accredited' })
  @IsString()
  @IsOptional()
  status_detail?: string;
}

class TransactionsDTO {
  @ApiProperty({
    description: 'List of payments',
    type: [PaymentTransactionDTO],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PaymentTransactionDTO)
  payments?: PaymentTransactionDTO[];
}

class MercadoPagoOrderDataDTO {
  @ApiProperty({
    description: 'External reference',
    example: 'ext_ref_1234',
  })
  @IsString()
  @IsOptional()
  external_reference?: string;

  @ApiProperty({
    description: 'Order ID',
    example: 'ORDTST01KCJF822YN8A8PSCBWM3AVM2J',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Order status',
    enum: MercadoPagoOrderStatus,
    example: MercadoPagoOrderStatus.PROCESSED,
  })
  @IsEnum(MercadoPagoOrderStatus)
  @IsOptional()
  status?: MercadoPagoOrderStatus;

  @ApiProperty({
    description: 'Status detail',
    enum: MercadoPagoStatusDetail,
    example: MercadoPagoStatusDetail.ACCREDITED,
  })
  @IsEnum(MercadoPagoStatusDetail)
  @IsOptional()
  status_detail?: MercadoPagoStatusDetail;

  @ApiProperty({
    description: 'Total amount ',
    example: 100000,
  })
  @IsOptional()
  total_amount?: number;

  @ApiProperty({
    description: 'Total paid amount (centavos)',
    example: 100000,
  })
  @IsOptional()
  total_paid_amount?: number;

  @ApiProperty({ description: 'Transactions details' })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionsDTO)
  transactions?: TransactionsDTO;

  @ApiProperty({
    description: 'Order type',
    enum: MercadoPagoOrderType,
    example: MercadoPagoOrderType.POINT,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Order version', example: 3 })
  @IsOptional()
  version?: number;
}

export class ProcessPaymentDTOSchemaRequest {
  @ApiProperty({
    description: 'Action do webhook do Mercado Pago',
    enum: MercadoPagoOrderAction,
    example: MercadoPagoOrderAction.PROCESSED,
  })
  @IsEnum(MercadoPagoOrderAction)
  @IsOptional()
  action?: MercadoPagoOrderAction;

  @ApiProperty({
    description: 'API version',
    example: 'v1',
  })
  @IsString()
  @IsOptional()
  api_version?: string;

  @ApiProperty({
    description: 'Application ID',
    example: '1271285729357409',
  })
  @IsString()
  @IsOptional()
  application_id?: string;

  @ApiProperty({
    description: 'Date created',
    example: '2021-11-01T02:02:02-04:00',
  })
  @IsString()
  @IsOptional()
  date_created?: string;

  @ApiProperty({
    description: 'Live mode',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  live_mode?: boolean;

  @ApiProperty({
    description: 'Type',
    example: 'order',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'User ID',
    example: 246696626,
  })
  @IsOptional()
  user_id?: number;

  @ApiProperty({
    description: 'Order data with payment details',
    type: MercadoPagoOrderDataDTO,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => MercadoPagoOrderDataDTO)
  data?: MercadoPagoOrderDataDTO;
}
