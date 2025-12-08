import { applyDecorators } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

export function MarkAsPaidConsumerDoc() {
  return applyDecorators(
    ApiTags('SQS Consumers'),
    ApiOperation({
      summary: '[SQS] Marcar pagamento como pago (Webhook Mercado Pago)',
      description:
        '**Consumer SQS - Fila: `AWS_SQS_MERCADO_PAGO_MARK_AS_PAID_QUEUE_URL`**\n\n' +
        'Este endpoint documenta o formato da mensagem SQS para processar webhooks do Mercado Pago.\n\n' +
        'Processa a notificação de pagamento e marca o pagamento como PAID.\n\n' +
        '**IMPORTANTE:** O campo `action` deve ser `payment.created` para o pagamento ser marcado como pago.\n\n' +
        '**Envie o JSON diretamente no body da mensagem SQS.**',
    }),
    ApiBody({
      description:
        'Formato da mensagem SQS. Envie diretamente o JSON com paymentReference e webhookPayload.',
      schema: {
        type: 'object',
        required: ['paymentReference', 'webhookPayload'],
        properties: {
          paymentReference: {
            type: 'string',
            format: 'uuid',
            description: 'Referência do pagamento (idempotency key)',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          webhookPayload: {
            type: 'object',
            description: 'Payload do webhook do Mercado Pago',
            required: ['action', 'api_version', 'application_id', 'date_created', 'id', 'live_mode', 'type', 'user_id', 'data'],
            properties: {
              action: {
                type: 'string',
                description: 'Ação do webhook (OBRIGATÓRIO: deve ser "payment.created")',
                example: 'payment.created',
              },
              api_version: {
                type: 'string',
                description: 'Versão da API',
                example: '2023-10-17',
              },
              application_id: {
                type: 'string',
                description: 'ID da aplicação',
                example: 'app_1234567890',
              },
              date_created: {
                type: 'string',
                description: 'Data de criação',
                example: '2023-10-17T12:34:56Z',
              },
              id: {
                type: 'string',
                description: 'ID do evento',
                example: 'evt_1234567890',
              },
              live_mode: {
                type: 'boolean',
                description: 'Modo produção',
                example: true,
              },
              type: {
                type: 'string',
                description: 'Tipo do evento',
                example: 'payment',
              },
              user_id: {
                type: 'number',
                description: 'ID do usuário',
                example: 123456,
              },
              data: {
                type: 'object',
                description: 'Dados do pagamento',
                properties: {
                  id: {
                    type: 'string',
                    description: 'ID do pagamento',
                    example: 'data_1234567890',
                  },
                },
              },
            },
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
              'Este endpoint é apenas para documentação. Envie a mensagem para a fila SQS: AWS_SQS_MERCADO_PAGO_MARK_AS_PAID_QUEUE_URL',
          },
        },
      },
    }),
  );
}

