import { UnitOfWork } from '@core/domain/unit-of-work';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { DataSource, QueryRunner } from 'typeorm';
import {
  PaymentDetailRepository,
  PaymentDetailRepositoryImpl,
} from './repositories/payment-detail.repository';
import { PaymentRepositoryImpl } from './repositories/payment.repository';
import { PaymentMapper } from './mapper/payment.mapper';
import { PaymentTypeORMEntity } from './entities/payment-typeorm.entity';
import { PixDetailORMEntity } from './entities/pix-detail-typeorm.entity';
import { PixDetailMapper } from './mapper/pix-detail.mapper';

export class TypeormUnitOfWork implements UnitOfWork {
  private queryRunner: QueryRunner;

  payments: PaymentRepository;
  paymentDetails: PaymentDetailRepository;

  constructor(private readonly dataSource: DataSource) {}

  async start(): Promise<void> {
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();

    this.payments = new PaymentRepositoryImpl(
      this.queryRunner.manager.getRepository(PaymentTypeORMEntity),
      new PaymentMapper(),
    );

    this.paymentDetails = new PaymentDetailRepositoryImpl(
      this.queryRunner.manager.getRepository(PixDetailORMEntity),
      new PixDetailMapper(),
    );
  }

  async commit(): Promise<void> {
    await this.queryRunner.commitTransaction();
    await this.queryRunner.release();
  }

  async rollback(): Promise<void> {
    await this.queryRunner.rollbackTransaction();
    await this.queryRunner.release();
  }
}
