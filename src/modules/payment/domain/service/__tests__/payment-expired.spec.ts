import { PaymentExpiredImpl } from '../payment-expired.service';
import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';

describe('PaymentExpiredImpl', () => {
  it('should return true if payment is expired', () => {
    const now = SystemDateImpl.nowUTC();
    const paymentDate = new Date(now.getTime() - 31 * 60 * 1000);
    const domainService = new PaymentExpiredImpl(
      new SystemDateImpl(now),
    );
    expect(domainService.isExpired(paymentDate)).toBeTruthy();
  });

  it('should return false if payment is not expired', () => {
    const now = SystemDateImpl.nowUTC();
    const paymentDate = new Date(now.getTime() - 29 * 60 * 1000);
    const domainService = new PaymentExpiredImpl(
      new SystemDateImpl(now),
    );
    expect(domainService.isExpired(paymentDate)).toBeFalsy();
  });
});
