import { DefaultTypeormUnitOfWork } from '@core/infra/database/typeorm/default-typeorm-uow';
import { PaymentUnitOfWork } from '@payment/domain/repositories/payment-uow.repository';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PaymentDetailRepository } from '@payment/infra/persistence/repositories/payment-detail.repository';
import { DataSource } from 'typeorm';

export class TypeormPaymentUOW
  extends DefaultTypeormUnitOfWork
  implements PaymentUnitOfWork
{
  constructor(
    dataSource: DataSource,
    readonly paymentRepository: PaymentRepository,
    readonly paymentDetailRepository: PaymentDetailRepository,
  ) {
    super(dataSource);
  }
}
