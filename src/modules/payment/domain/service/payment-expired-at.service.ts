import { SystemDateDomainService } from '@core/domain/service/system-date.service';

export class PaymentExpiredAtDomainServiceImpl {
  constructor(
    private readonly systemDateDomainService: SystemDateDomainService,
  ) {}

  execute() {
    const response = this.systemDateDomainService.create(
      this.systemDateDomainService.addMinutes(
        this.systemDateDomainService.now(),
        10,
      ),
    );

    return {
      date: response,
    };
  }
}
