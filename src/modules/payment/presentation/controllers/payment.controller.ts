import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreatePaymentDto } from '../dto/request/create-payment.dto';
import { CreatePaymentResponseDto } from '../dto/response/create-payment-response.dto';
import { CreatePaymentDoc } from '../docs/payment/create-payment.doc';
import { DomainExceptionFilter } from '../filters/domain-exception.filter';
import type { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';

@ApiTags('Payments')
@Controller('payments')
@UseFilters(DomainExceptionFilter)
export class PaymentController {
  constructor(private readonly createPaymentUseCase: CreatePaymentUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreatePaymentDoc()
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<CreatePaymentResponseDto> {
    const { qrCode } = await this.createPaymentUseCase.execute({
      amount: createPaymentDto.amount,
    });

    return {
      qrCode,
    };
  }
}
