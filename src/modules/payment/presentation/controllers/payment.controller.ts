import {
    BadRequestException,
    Controller,
    Get,
    Inject,
    Param,
    Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { GetPaymentDetailsBySessionIdUseCase } from '@payment/application/use-cases/get-payment-details-by-session-id/get-payment-details-by-session-id.use-case';
import { GetQRCodeByIdempotencyKeyUseCase } from '@payment/application/use-cases/get-qrcode-by-idempotency-key/get-qrcode-by-idempotency-key.use-case';
import { GetQRCodeByPaymentIdUseCase } from '@payment/application/use-cases/get-qrcode-by-payment-id/get-qrcode-by-payment-id.use-case';
import { GetQRCodeBySessionIdUseCase } from '@payment/application/use-cases/get-qrcode-by-session-id/get-qrcode-by-session-id.use-case';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';
import { SessionIdVO } from '@payment/domain/value-objects/session-id.vo';
import { GetPaymentDetailsBySessionIdDoc } from '@payment/presentation/docs/payment/get-payment-details-by-session-id.doc';
import { GetQRCodeByIdempotencyKeyDoc } from '@payment/presentation/docs/payment/get-qrcode-by-idempotency-key.doc';
import { GetQRCodeByPaymentDoc } from '@payment/presentation/docs/payment/get-qrcode-by-payment.doc';
import { GetQRCodeBySessionIdDoc } from '@payment/presentation/docs/payment/get-qrcode-by-session-id.doc';
import { PaymentDetailsResponseDto } from '@payment/presentation/dto/response/payment-details-response.dto';

@Controller('payments')
@ApiTags('Payments')
export class PaymentController {
  constructor(
    @Inject(GetQRCodeByPaymentIdUseCase)
    private readonly getQRCodeByPaymentIdUseCase: GetQRCodeByPaymentIdUseCase,
    @Inject(GetQRCodeByIdempotencyKeyUseCase)
    private readonly getQRCodeByIdempotencyKeyUseCase: GetQRCodeByIdempotencyKeyUseCase,
    @Inject(GetQRCodeBySessionIdUseCase)
    private readonly getQRCodeBySessionIdUseCase: GetQRCodeBySessionIdUseCase,
    @Inject(GetPaymentDetailsBySessionIdUseCase)
    private readonly getPaymentDetailsBySessionIdUseCase: GetPaymentDetailsBySessionIdUseCase,
  ) {}

  @Get(':id/qrcode')
  @GetQRCodeByPaymentDoc()
  async getQRCodeByPaymentId(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<void> {
    const qrCode = await this.getQRCodeByPaymentIdUseCase.execute(
      UniqueEntityID.create(id),
    );

    if (qrCode.isFailure) {
      throw new BadRequestException(qrCode.error.message);
    }

    response.set({
      'Content-Type': 'image/png',
      'Content-Length': qrCode.value.length,
    });

    response.send(qrCode.value);
  }

  @Get('idempotency-key/:idempotencyKey/qrcode')
  @GetQRCodeByIdempotencyKeyDoc()
  async getQRCodeByIdempotencyKey(
    @Param('idempotencyKey') idempotencyKey: string,
    @Res() response: Response,
  ): Promise<void> {
    const qrCode = await this.getQRCodeByIdempotencyKeyUseCase.execute(
      IdempotencyKeyVO.create(idempotencyKey),
    );

    if (qrCode.isFailure) {
      throw new BadRequestException(qrCode.error.message);
    }

    response.set({
      'Content-Type': 'image/png',
      'Content-Length': qrCode.value.length,
    });

    response.send(qrCode.value);
  }

  @Get('session/:sessionId/qrcode')
  @GetQRCodeBySessionIdDoc()
  async getQRCodeBySessionId(
    @Param('sessionId') sessionId: string,
    @Res() response: Response,
  ): Promise<void> {
    const qrCode = await this.getQRCodeBySessionIdUseCase.execute(
      SessionIdVO.create(sessionId),
    );

    if (qrCode.isFailure) {
      throw new BadRequestException(qrCode.error.message);
    }

    response.set({
      'Content-Type': 'image/png',
      'Content-Length': qrCode.value.length,
    });

    response.send(qrCode.value);
  }

  @Get('session/:sessionId')
  @GetPaymentDetailsBySessionIdDoc()
  async getPaymentDetailsBySessionId(
    @Param('sessionId') sessionId: string,
  ): Promise<PaymentDetailsResponseDto> {
    const result = await this.getPaymentDetailsBySessionIdUseCase.execute(
      SessionIdVO.create(sessionId),
    );

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return result.value;
  }
}
