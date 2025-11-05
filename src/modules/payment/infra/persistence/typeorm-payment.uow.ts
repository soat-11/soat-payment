import { DefaultTypeormUnitOfWork } from '@core/infra/database/typeorm/default-typeorm-uow';
import { PaymentUnitOfWork } from '@payment/domain/repositories/payment-uow.repository';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { PaymentDetailRepository } from '@payment/domain/repositories/payment-detail.repository';
import { DataSource } from 'typeorm';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { TransactionalRepository } from '@core/infra/database/typeorm/transactional-repository';

export class TypeormPaymentUOW
  extends DefaultTypeormUnitOfWork
  implements PaymentUnitOfWork
{
  constructor(
    dataSource: DataSource,
    readonly paymentRepository: PaymentRepository & TransactionalRepository,
    readonly paymentDetailRepository: PaymentDetailRepository &
      TransactionalRepository,
    readonly logger: AbstractLoggerService,
  ) {
    super(dataSource, logger);
  }

  async start(): Promise<void> {
    await super.start();
    const queryRunner = this.getQueryRunner();

    this.logger.log('Setting transactional manager for payment repository');
    this.paymentRepository.setTransactionalManager(queryRunner);

    this.logger.log(
      'Setting transactional manager for payment detail repository',
    );
    this.paymentDetailRepository.setTransactionalManager(queryRunner);
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
    this.logger.log('Clearing transactional manager for payment repository');
    this.paymentRepository.clearTransactionalManager();

    this.logger.log(
      'Clearing transactional manager for payment detail repository',
    );
    this.paymentDetailRepository.clearTransactionalManager();
  }
}
