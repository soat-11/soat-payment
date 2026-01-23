import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { PaymentDetailsResponseDto } from '@payment/presentation/dto/response/payment-details-response.dto';

export function GetPaymentDetailsBySessionIdDoc() {
  return applyDecorators(
    ApiTags('Payment'),
    ApiOperation({
      summary: 'Obter detalhes do pagamento por Session ID',
      description:
        'Obter informações básicas do pagamento utilizando o Session ID',
    }),
    ApiParam({
      name: 'sessionId',
      type: 'string',
      description: 'Session ID do Pagamento',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({
      description: 'Detalhes do pagamento',
      type: PaymentDetailsResponseDto,
    }),
  );
}
