import { ApiProperty } from '@nestjs/swagger';
import { Base64ToBuffer } from '@core/infra/http/transformers/base64-to-buffer.transformer';

export class CreatePaymentResponseDto {
  @ApiProperty({
    description: 'QR CODE image in PNG format',
    type: 'string',
    format: 'binary',
  })
  @Base64ToBuffer()
  qrCode: Buffer;
}
