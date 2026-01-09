import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

export function GetQRCodeByPaymentDoc() {
  return applyDecorators(
    ApiTags('Payment'),
    ApiOperation({
      summary: 'Obter QR Code por ID de Pagamento',
      description: 'Obter a imagem do QR Code por ID de Pagamento',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'ID de Pagamento',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );
}
