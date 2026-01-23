import { ApiProperty } from '@nestjs/swagger';

import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';

export class PaymentDetailsResponseDto {
  @ApiProperty({
    description: 'ID do pagamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Status do pagamento',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Valor do pagamento em centavos',
    example: 1000,
  })
  amount: number;

  @ApiProperty({
    description: 'Tipo do pagamento',
    enum: PaymentType,
    example: PaymentType.PIX,
  })
  type: PaymentType;

  @ApiProperty({
    description: 'Data de expiração do pagamento',
    example: '2024-01-01T00:00:00.000Z',
  })
  expiresAt: Date;
}
