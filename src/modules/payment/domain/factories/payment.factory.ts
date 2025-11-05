import { PaymentEntity } from '@payment/domain/entities/payment.entity';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { SystemDateDomainService } from '@core/domain/service/system-date.service';
import { PaymentExpiredAtDomainServiceImpl } from '@payment/domain/service/payment-expired-at.service';

export interface PaymentFactory {
  create(props: { amount: number; type: PaymentType }): PaymentEntity;
}

export class PaymentFactoryImpl implements PaymentFactory {
  constructor(private readonly systemDateService: SystemDateDomainService) {}

  create(props: { amount: number; type: PaymentType }): PaymentEntity {
    const expiresAt = new PaymentExpiredAtDomainServiceImpl(
      this.systemDateService,
    ).execute().date;

    return PaymentEntity.create({
      amount: props.amount,
      type: props.type,
      expiresAt,
    });
  }
}
