import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  Inject,
  Headers,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { CreatePaymentDto } from '../dto/request/create-payment.dto';
import { CreatePaymentResponseDto } from '../dto/response/create-payment-response.dto';
import { CreatePaymentDoc } from '../docs/payment/create-payment.doc';
import { DomainExceptionFilter } from '../filters/domain-exception.filter';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';

@ApiTags('Payments')
@Controller('payments')
@UseFilters(DomainExceptionFilter)
export class PaymentController {
  constructor(
    @Inject(CreatePaymentUseCase)
    private readonly createPaymentUseCase: CreatePaymentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'image/png')
  @Header('Content-Disposition', 'inline; filename="qrcode.png"')
  @CreatePaymentDoc()
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ): Promise<StreamableFile> {
    const result = await this.createPaymentUseCase.execute({
      sessionId: createPaymentDto.sessionId,
      idempotencyKey: idempotencyKey,
    });

    const dto = plainToInstance(CreatePaymentResponseDto, {
      qrCode: result.image,
    });

    return new StreamableFile(dto.qrCode);
  }
}
