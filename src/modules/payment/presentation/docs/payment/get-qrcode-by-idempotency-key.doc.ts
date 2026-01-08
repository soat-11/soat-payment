import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

export function GetQRCodeByIdempotencyKeyDoc() {
  return applyDecorators(
    ApiTags('Payment'),
    ApiOperation({
      summary: 'Obter QR Code por Chave de Idempotência',
      description:
        'Obter a imagem do QR Code utilizando a chave de idempotência do pagamento',
    }),
    ApiParam({
      name: 'idempotencyKey',
      type: 'string',
      description: 'Chave de Idempotência do Pagamento',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );
}
