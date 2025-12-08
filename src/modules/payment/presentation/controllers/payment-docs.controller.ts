import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreatePaymentConsumerDoc } from '@payment/presentation/docs/payment/create-payment-consumer.doc';
import { MarkAsPaidConsumerDoc } from '@payment/presentation/docs/payment/mark-as-paid-consumer.doc';
import { CreatePaymentDto } from '@payment/presentation/dto/request/create-payment.dto';
import { MarkAsPaidDto } from '@payment/presentation/dto/request/mark-as-paid.dto';

@Controller('docs/consumers')
export class PaymentDocsController {
  @Post('create-payment')
  @HttpCode(HttpStatus.ACCEPTED)
  @CreatePaymentConsumerDoc()
  createPaymentMessageFormat(@Body() _dto: CreatePaymentDto): {
    message: string;
  } {
    return {
      message:
        'Este endpoint é apenas para documentação. Envie a mensagem para a fila SQS: AWS_SQS_CREATE_PAYMENT_QUEUE_URL',
    };
  }

  @Post('mark-as-paid')
  @HttpCode(HttpStatus.ACCEPTED)
  @MarkAsPaidConsumerDoc()
  markAsPaidMessageFormat(@Body() _dto: MarkAsPaidDto): {
    message: string;
  } {
    return {
      message:
        'Este endpoint é apenas para documentação. Envie a mensagem para a fila SQS: AWS_SQS_MERCADO_PAGO_MARK_AS_PAID_QUEUE_URL',
    };
  }
}
