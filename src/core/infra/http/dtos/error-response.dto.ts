import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400,
    type: 'number',
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Valor do pagamento inválido',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];
}
