import { SystemDateDomainService } from '@core/domain/service/system-date.service';

export type PaymentExpiredOutput = boolean;

export interface PaymentExpired {
  isExpired(payment: Date): PaymentExpiredOutput;
}

export class PaymentExpiredImpl implements PaymentExpired {
  private readonly thirtyMinutes = 30;
  constructor(private readonly systemDate: SystemDateDomainService) {}

  isExpired(paymentDate: Date): boolean {
    return (
      this.systemDate.now().getTime() >
      paymentDate.getTime() + this.thirtyMinutes * 60 * 1000
    );
  }
}
