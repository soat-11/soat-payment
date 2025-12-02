import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreatePaymentConsumerDoc } from '@payment/presentation/docs/payment/create-payment-consumer.doc';
import { CreatePaymentDto } from '@payment/presentation/dto/request/create-payment.dto';

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
}
