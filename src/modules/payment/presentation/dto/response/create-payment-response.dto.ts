import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreatePaymentResponseDto {
  @ApiProperty({
    description: 'Código QR do PIX para pagamento',
    example:
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000',
    minLength: 10,
    type: 'string',
  })
  @IsString({ message: 'O QR Code deve ser uma string' })
  @MinLength(10, { message: 'O QR Code deve ter no mínimo 10 caracteres' })
  qrCode: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Valor do pagamento inválido',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Bad Request',
  })
  error: string;
}
