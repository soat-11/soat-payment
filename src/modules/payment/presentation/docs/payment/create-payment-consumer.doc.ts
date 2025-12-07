import { applyDecorators } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

export function CreatePaymentConsumerDoc() {
  return applyDecorators(
    ApiTags('SQS Consumers'),
    ApiOperation({
      summary: '[SQS] Criar novo pagamento PIX',
      description:
        '**Consumer SQS - Fila: `AWS_SQS_CREATE_PAYMENT_QUEUE_URL`**\n\n' +
        'Este endpoint documenta o formato da mensagem SQS para criação de pagamento.\n\n' +
        'Cria um novo pagamento do tipo PIX. ' +
        'O pagamento é criado com status PENDING e possui um tempo de expiração de 10 minutos.\n\n' +
        '**Envie o JSON diretamente no body da mensagem SQS.**',
    }),
    ApiBody({
      description:
        'Formato da mensagem SQS. Envie diretamente o JSON com sessionId e idempotencyKey.',
      schema: {
        type: 'object',
        required: ['sessionId', 'idempotencyKey'],
        properties: {
          sessionId: {
            type: 'string',
            format: 'uuid',
            description: 'ID da sessão do usuário',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          idempotencyKey: {
            type: 'string',
            format: 'uuid',
            description: 'Chave de idempotência para evitar duplicação',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
        },
      },
    }),
    ApiAcceptedResponse({
      description:
        'Mensagem documentada. Envie para a fila SQS correspondente.',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example:
              'Este endpoint é apenas para documentação. Envie a mensagem para a fila SQS.',
          },
        },
      },
    }),
  );
}
