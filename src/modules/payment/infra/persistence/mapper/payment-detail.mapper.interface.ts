import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { AnyPaymentDetail } from '@payment/domain/value-objects/payment-detail.vo';
import { Result } from '@core/domain/result';

export interface PaymentDetailMapper<TOrm, TDomain extends AnyPaymentDetail> {
  readonly supportedType: PaymentType;

  toDomain(orm: TOrm): Result<TDomain>;
  toORM(domain: TDomain, paymentId: string): Result<TOrm>;
}
