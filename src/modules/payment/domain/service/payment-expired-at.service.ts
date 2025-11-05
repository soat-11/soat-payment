import { SystemDateDomainService } from '@core/domain/service/system-date.service';

export class PaymentExpiredAtDomainServiceImpl {
  private static readonly EXPIRATION_MINUTES = 10;

  constructor(
    private readonly systemDateDomainService: SystemDateDomainService,
  ) {}

  calculateExpirationDate(): Date {
    const now = this.systemDateDomainService.now();
    return this.systemDateDomainService.addMinutes(
      now,
      PaymentExpiredAtDomainServiceImpl.EXPIRATION_MINUTES,
    );
  }
}
