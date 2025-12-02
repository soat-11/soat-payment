import { applyDecorators } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreatePaymentDto } from '@payment/presentation/dto/request/create-payment.dto';

export function CreatePaymentConsumerDoc() {
  return applyDecorators(
    ApiTags('SQS Consumers'),
    ApiExtraModels(CreatePaymentDto),
    ApiOperation({
      summary: '[SQS] Criar novo pagamento PIX',
      description:
        '**Consumer SQS - Fila: `AWS_SQS_CREATE_PAYMENT_QUEUE_URL`**\n\n' +
        'Este endpoint documenta o formato da mensagem SQS para criação de pagamento.\n\n' +
        'Cria um novo pagamento do tipo PIX. ' +
        'O pagamento é criado com status PENDING e possui um tempo de expiração de 10 minutos.\n\n' +
        '**O campo `Message` contém o payload stringificado (ver schema CreatePaymentDto)**',
    }),
    ApiBody({
      description:
        'Formato da mensagem SQS/SNS. O campo `Message` é um JSON stringificado do CreatePaymentDto',
      schema: {
        type: 'object',
        required: ['Message'],
        properties: {
          Message: {
            type: 'string',
            description:
              'JSON stringificado do payload. Ver schema CreatePaymentDto para os campos internos.',
            example:
              '{"sessionId": "123e4567-e89b-12d3-a456-426614174000", "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"}',
          },
        },
        externalDocs: {
          description: 'Schema do payload (CreatePaymentDto)',
          url: getSchemaPath(CreatePaymentDto),
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
