import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Valor do pagamento em reais',
    example: 100.5,
    minimum: 0.01,
    type: 'number',
  })
  @IsNumber({}, { message: 'O valor deve ser um número' })
  @IsPositive({ message: 'O valor deve ser positivo' })
  @Min(0.01, { message: 'O valor mínimo é R$ 0,01' })
  amount: number;
}
