import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class StartPaymentWorkflowDto {
  @ApiProperty({
    description: 'Session ID from cart/order service',
    example: 'session-12345',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Idempotency key to prevent duplicate payments',
    example: 'idem-abc-123',
  })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiPropertyOptional({
    description: 'Timeout in minutes to wait for payment confirmation',
    example: 30,
    default: 30,
    minimum: 1,
    maximum: 60,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(60)
  timeoutMinutes?: number;
}

export class SignalPaymentDto {
  @ApiProperty({
    description: 'Payment status from webhook',
    enum: ['confirmed', 'failed'],
    example: 'confirmed',
  })
  @IsString()
  @IsNotEmpty()
  status: 'confirmed' | 'failed';

  @ApiPropertyOptional({
    description: 'Reason for failure (required if status is failed)',
    example: 'Insufficient funds',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

