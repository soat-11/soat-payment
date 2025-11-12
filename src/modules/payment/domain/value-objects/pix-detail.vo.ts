import { PaymentDetailVO } from './payment-detail.vo';
import { PaymentType } from '../enum/payment-type.enum';
import { PixDetailInvalidException } from '@payment/domain/exceptions/payment.exception';

export type PixDetailProps = {
  qrCode: string;
};

export class PixDetailVO extends PaymentDetailVO<PixDetailProps> {
  protected constructor(props: PixDetailProps) {
    super(props);
  }

  protected validate(input: PixDetailProps): void {
    if (typeof input.qrCode !== 'string' || input.qrCode.trim() === '') {
      throw new PixDetailInvalidException();
    }
  }

  get paymentType(): PaymentType {
    return PaymentType.PIX;
  }

  get qrCode(): string {
    return this.value.qrCode;
  }

  toSummary(): string {
    return `PIX: QR Code [${this.qrCode.substring(0, 20)}...]`;
  }

  static create(props: PixDetailProps): PixDetailVO {
    return new PixDetailVO(props);
  }
}
