import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão do usuário',
    type: 'string',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'A sessão deve ser um UUID válido, e versão 4' })
  sessionId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Chave de idempotência para evitar duplicação de requisições',
    type: 'string',
    format: 'uuid',
  })
  @IsUUID(4, {
    message: 'A chave de idempotência deve ser um UUID válido, e versão 4',
  })
  idempotencyKey: string;
}
