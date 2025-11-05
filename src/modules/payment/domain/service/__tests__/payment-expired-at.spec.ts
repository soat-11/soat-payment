import { SystemDateImpl } from '@core/domain/service/system-date-impl.service';
import { PaymentExpiredAtDomainServiceImpl } from '../payment-expired-at.service';

describe('PaymentExpiredAtDomainServiceImpl', () => {
  it('should return a date 10 minutes from now', () => {
    const now = new Date('2025-04-01T12:00:00.000Z');

    const domainService = new PaymentExpiredAtDomainServiceImpl(
      new SystemDateImpl(now),
    );
    expect(domainService.calculateExpirationDate().toISOString()).toEqual(
      '2025-04-01T12:10:00.000Z',
    );
  });
});
