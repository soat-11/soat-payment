import { PaymentExpiredImpl } from '../payment-expired.service';
import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';

describe('PaymentExpiredImpl', () => {
  it('should return true if payment is expired', () => {
    const paymentDate = new Date(Date.now() - 31 * 60 * 1000);
    const domainService = new PaymentExpiredImpl(
      new SystemDateImpl(new Date(Date.now())),
    );
    expect(domainService.isExpired(paymentDate)).toBeTruthy();
  });

  it('should return false if payment is not expired', () => {
    const paymentDate = new Date(Date.now() - 29 * 60 * 1000);
    const domainService = new PaymentExpiredImpl(
      new SystemDateImpl(new Date(Date.now())),
    );
    expect(domainService.isExpired(paymentDate)).toBeFalsy();
  });
});
