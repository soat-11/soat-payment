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
import { GetQRCodeByIdempotencyKeyUseCase } from '@payment/application/use-cases/get-qrcode-by-idempotency-key/get-qrcode-by-idempotency-key.use-case';
import { GetQRCodeByPaymentIdUseCase } from '@payment/application/use-cases/get-qrcode-by-payment-id/get-qrcode-by-payment-id.use-case';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';
import { GetQRCodeByIdempotencyKeyDoc } from '@payment/presentation/docs/payment/get-qrcode-by-idempotency-key.doc';
import { GetQRCodeByPaymentDoc } from '@payment/presentation/docs/payment/get-qrcode-by-payment.doc';

@Controller('payments')
@ApiTags('Payments')
export class PaymentController {
  constructor(
    @Inject(GetQRCodeByPaymentIdUseCase)
    private readonly getQRCodeByPaymentIdUseCase: GetQRCodeByPaymentIdUseCase,
    @Inject(GetQRCodeByIdempotencyKeyUseCase)
    private readonly getQRCodeByIdempotencyKeyUseCase: GetQRCodeByIdempotencyKeyUseCase,
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
}
