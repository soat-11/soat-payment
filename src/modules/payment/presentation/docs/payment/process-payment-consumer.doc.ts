import { applyDecorators } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

export function ProcessPaymentConsumerDoc() {
  return applyDecorators(
    ApiTags('SQS Consumers'),
    ApiOperation({
      summary: '[SQS] Processar pagamento (Webhook Mercado Pago)',
      description:
        '**Consumer SQS - Fila: `AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL`**\n\n' +
        'Este endpoint documenta o formato da mensagem SQS para processar webhooks do Mercado Pago.\n\n' +
        'Processa a notificação de pagamento e executa a ação correspondente.\n\n' +
        '**Ações disponíveis do Mercado Pago:**\n' +
        '- `order.processed`: Pagamento processado com sucesso\n' +
        '- `order.refunded`: Pagamento reembolsado\n' +
        '- `order.canceled`: Pagamento cancelado\n\n' +
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
            description: 'Referência do pagamento (Order ID do Mercado Pago)',
            example: 'ORD01JV3AW3NFSTSTB669F41NACDX',
          },
          webhookPayload: {
            type: 'object',
            description: 'Payload do webhook de Order do Mercado Pago',
            required: ['action', 'api_version', 'application_id', 'data'],
            properties: {
              action: {
                type: 'string',
                enum: ['order.processed', 'order.refunded', 'order.canceled'],
                description:
                  'Ação do webhook: order.processed (pago), order.refunded (reembolsado), order.canceled (cancelado)',
                example: 'order.processed',
              },
              api_version: {
                type: 'string',
                description: 'Versão da API',
                example: 'v1',
              },
              application_id: {
                type: 'string',
                description: 'ID da aplicação',
                example: '7364289770550796',
              },
              date_created: {
                type: 'string',
                description: 'Data de criação',
                example: '2025-05-12T22:46:59.635090485Z',
              },
              live_mode: {
                type: 'boolean',
                description: 'Modo produção',
                example: false,
              },
              type: {
                type: 'string',
                description: 'Tipo do evento',
                example: 'order',
              },
              user_id: {
                type: 'string',
                description: 'ID do usuário',
                example: '1403498245',
              },
              data: {
                type: 'object',
                description: 'Dados da ordem',
                properties: {
                  external_reference: {
                    type: 'string',
                    description: 'Referência externa',
                    example: 'ER_123456',
                  },
                  id: {
                    type: 'string',
                    description: 'ID da ordem',
                    example: 'ORD01JV3AW3NFSTSTB669F41NACDX',
                  },
                  status: {
                    type: 'string',
                    enum: ['processed', 'refunded', 'canceled'],
                    description: 'Status da ordem',
                    example: 'processed',
                  },
                  status_detail: {
                    type: 'string',
                    enum: ['accredited', 'refunded', 'canceled'],
                    description: 'Detalhe do status',
                    example: 'accredited',
                  },
                  total_amount: {
                    type: 'string',
                    description: 'Valor total',
                    example: '30.00',
                  },
                  total_paid_amount: {
                    type: 'string',
                    description: 'Valor total pago',
                    example: '30.00',
                  },
                  type: {
                    type: 'string',
                    description: 'Tipo da ordem',
                    example: 'qr',
                  },
                  version: {
                    type: 'number',
                    description: 'Versão da ordem',
                    example: 2,
                  },
                  transactions: {
                    type: 'object',
                    description:
                      'Transações (presente apenas em order.processed)',
                    properties: {
                      payments: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            amount: { type: 'string', example: '30.00' },
                            id: {
                              type: 'string',
                              example: 'PAY01JV3AW3NFSTSTB669F4JSAA6C',
                            },
                            paid_amount: { type: 'string', example: '30.00' },
                            status: { type: 'string', example: 'processed' },
                            status_detail: {
                              type: 'string',
                              example: 'accredited',
                            },
                            reference: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', example: '92937960454' },
                              },
                            },
                            payment_method: {
                              type: 'object',
                              properties: {
                                id: {
                                  type: 'string',
                                  example: 'account_money',
                                },
                                type: {
                                  type: 'string',
                                  example: 'account_money',
                                },
                                installments: { type: 'number', example: 1 },
                              },
                            },
                          },
                        },
                      },
                    },
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
              'Este endpoint é apenas para documentação. Envie a mensagem para a fila SQS: AWS_SQS_MERCADO_PAGO_PROCESS_PAYMENT_QUEUE_URL',
          },
        },
      },
    }),
  );
}
