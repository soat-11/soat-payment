import { UnitOfWork } from '@core/infra/database/persistence/unit-of-work';
import { PaymentRepository } from './payment.repository';
import { PaymentDetailRepository } from './payment-detail.repository';

export interface PaymentUnitOfWork extends UnitOfWork {
  readonly paymentRepository: PaymentRepository;
  readonly paymentDetailRepository: PaymentDetailRepository;
}
