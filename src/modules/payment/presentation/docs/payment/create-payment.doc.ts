import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { CreatePaymentDto } from '../../dto/request/create-payment.dto';
import {
  CreatePaymentResponseDto,
  ErrorResponseDto,
} from '../../dto/response/create-payment-response.dto';

export function CreatePaymentDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Criar novo pagamento PIX',
      description:
        'Cria um novo pagamento do tipo PIX com o valor e QR Code informados. ' +
        'O pagamento é criado com status PENDING e possui um tempo de expiração de 10 minutos.',
    }),

    ApiBody({
      type: CreatePaymentDto,
      description: 'Dados necessários para criar um pagamento',
      examples: {
        success: {
          summary: 'Pagamento válido',
          description: 'Exemplo de requisição válida',
          value: {
            amount: 100.5,
            qrCode:
              '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000',
          },
        },
      },
    }),

    ApiResponse({
      status: 201,
      description: 'Pagamento criado com sucesso',
      type: CreatePaymentResponseDto,
      content: {
        'application/json': {
          examples: {
            success: {
              summary: 'Sucesso',
              value: {
                message: 'Pagamento criado com sucesso',
                status: 'success',
                timestamp: '2025-11-05T10:00:00.000Z',
              },
            },
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: 'Dados inválidos ou regra de negócio violada',
      type: ErrorResponseDto,
      content: {
        'application/json': {
          examples: {
            invalidAmount: {
              summary: 'Valor inválido',
              value: {
                statusCode: 400,
                message: ['O valor deve ser positivo'],
                error: 'Bad Request',
                timestamp: '2025-11-05T10:00:00.000Z',
                path: '/payments',
              },
            },
            invalidQrCode: {
              summary: 'QR Code inválido',
              value: {
                statusCode: 400,
                message: ['O QR Code deve ter no mínimo 10 caracteres'],
                error: 'Bad Request',
                timestamp: '2025-11-05T10:00:00.000Z',
                path: '/payments',
              },
            },
            businessRule: {
              summary: 'Regra de negócio violada',
              value: {
                statusCode: 400,
                message: 'Valor do pagamento deve ser maior que zero.',
                error: 'Bad Request',
                timestamp: '2025-11-05T10:00:00.000Z',
                path: '/payments',
              },
            },
          },
        },
      },
    }),

    ApiInternalServerErrorResponse({
      description: 'Erro interno no servidor',
      type: ErrorResponseDto,
      content: {
        'application/json': {
          examples: {
            serverError: {
              summary: 'Erro de persistência',
              value: {
                statusCode: 500,
                message: 'Erro ao salvar pagamento',
                error: 'Internal Server Error',
                timestamp: '2025-11-05T10:00:00.000Z',
                path: '/payments',
              },
            },
          },
        },
      },
    }),
  );
}
