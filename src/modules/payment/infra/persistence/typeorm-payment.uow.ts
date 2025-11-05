import { DefaultTypeormUnitOfWork } from '@core/infra/database/typeorm/default-typeorm-uow';
import { PaymentUnitOfWork } from '@payment/domain/repositories/payment-uow.repository';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import {
  PaymentDetailRepository,
  PaymentDetailRepositoryImpl,
} from '@payment/infra/persistence/repositories/payment-detail.repository';
import { DataSource } from 'typeorm';
import { PaymentRepositoryImpl } from './repositories/payment.repository';

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

  async start(): Promise<void> {
    await super.start();
    const queryRunner = this.getQueryRunner();

    // Configure repositories to use transactional manager
    if (this.paymentRepository instanceof PaymentRepositoryImpl) {
      this.paymentRepository.setTransactionalManager(queryRunner);
    }
    if (this.paymentDetailRepository instanceof PaymentDetailRepositoryImpl) {
      this.paymentDetailRepository.setTransactionalManager(queryRunner);
    }
  }

  async commit(): Promise<void> {
    await super.commit();
    this.clearTransactionalManagers();
  }

  async rollback(): Promise<void> {
    await super.rollback();
    this.clearTransactionalManagers();
  }

  private clearTransactionalManagers(): void {
    if (this.paymentRepository instanceof PaymentRepositoryImpl) {
      this.paymentRepository.clearTransactionalManager();
    }
    if (this.paymentDetailRepository instanceof PaymentDetailRepositoryImpl) {
      this.paymentDetailRepository.clearTransactionalManager();
    }
  }
}
