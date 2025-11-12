import { applyDecorators, InternalServerErrorException } from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiHeader,
  ApiOkResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { ErrorResponseDto } from '@core/infra/http/dtos/error-response.dto';
import { faker } from '@faker-js/faker';
import {
  PaymentAlreadyExistsException,
  PaymentAmountInvalidException,
  PaymentExternalPaymentIdRequiredException,
  PaymentProviderInvalidException,
  PaymentStatusInvalidException,
} from '@payment/domain/exceptions/payment.exception';
import { PaymentProviders } from '@payment/domain/enum/payment-provider.enum';
import { PaymentStatus } from '@payment/domain/enum/payment-status.enum';
import { CreatePaymentDto } from '@payment/presentation/dto/request/create-payment.dto';

export function CreatePaymentDoc() {
  return applyDecorators(
    ApiHeader({
      name: 'x-idempotency-key',
      description:
        'Chave de idempotência para evitar duplicação de requisições',
      required: true,
      example: faker.string.uuid(),
    }),
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
            sessionId: '123e4567-e89b-12d3-a456-426614174000',
          },
        },
      },
    }),

    ApiOkResponse({
      description: 'Imagem PNG do QR Code para pagamento PIX',
      schema: {
        type: 'string',
        format: 'binary',
      },
      content: {
        'image/png': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: 'Bad Request',
      type: ErrorResponseDto,
      examples: {
        PaymentAmountInvalid: {
          summary: 'Valor do pagamento inválido',
          value: { message: new PaymentAmountInvalidException(0).message },
        },
        PaymentProviderInvalid: {
          summary: 'Provedor de pagamento inválido',
          value: {
            message: new PaymentProviderInvalidException(
              PaymentProviders.MERCADO_PAGO,
            ).message,
          },
        },
        PaymentExternalPaymentIdRequired: {
          summary: 'ID externo do pagamento é obrigatório',
          value: {
            message: new PaymentExternalPaymentIdRequiredException('').message,
          },
        },
        PaymentStatusInvalid: {
          summary: 'Status de pagamento inválido',
          value: {
            message: new PaymentStatusInvalidException(PaymentStatus.PENDING)
              .message,
          },
        },
      },
    }),
    ApiConflictResponse({
      description: 'Conflict',
      type: ErrorResponseDto,
      examples: {
        PaymentAlreadyExists: {
          summary: 'Pagamento já existe',
          value: { message: new PaymentAlreadyExistsException().message },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
      type: ErrorResponseDto,
      examples: {
        InternalServerError: {
          summary: 'Erro interno do servidor',
          value: { message: new InternalServerErrorException().message },
        },
      },
    }),
  );
}
