import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

export function GetQRCodeBySessionIdDoc() {
  return applyDecorators(
    ApiTags('Payment'),
    ApiOperation({
      summary: 'Obter QR Code por Session ID',
      description:
        'Obter a imagem do QR Code utilizando o Session ID do pagamento',
    }),
    ApiParam({
      name: 'sessionId',
      type: 'string',
      description: 'Session ID do Pagamento',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );
}
