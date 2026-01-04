import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    example: 'ca2cc362-b56d-4013-93a5-a64fb64594a8',
    description: 'ID da sessão do usuário',
    type: 'string',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'A sessão deve ser um UUID válido, e versão 4' })
  sessionId: string;

  @ApiProperty({
    example: '9a700a9c-30ae-4f5a-a83a-6eb3c6d94179',
    description: 'Chave de idempotência para evitar duplicação de requisições',
    type: 'string',
    format: 'uuid',
  })
  @IsUUID(4, {
    message: 'A chave de idempotência deve ser um UUID válido, e versão 4',
  })
  idempotencyKey: string;
}
