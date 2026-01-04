import { INestApplication } from '@nestjs/common';
import { DataSource, MongoRepository } from 'typeorm';

import { PaymentMongoDBEntity } from '@payment/infra/persistence/entities/payment-mongodb.entity';
import { PixDetailMongoDBEntity } from '@payment/infra/persistence/entities/pix-detail-mongodb.entity';

import { PaymentDSL } from './payment.dsl';

export interface DSLRepositories {
  payment: MongoRepository<PaymentMongoDBEntity>;
  pixDetail: MongoRepository<PixDetailMongoDBEntity>;
}

export function createDSL(app: INestApplication) {
  const dataSource = app.get(DataSource);

  const repositories: DSLRepositories = {
    payment: dataSource.getMongoRepository(PaymentMongoDBEntity),
    pixDetail: dataSource.getMongoRepository(PixDetailMongoDBEntity),
  };

  return {
    payment: new PaymentDSL(app),
    repositories,
    app,

    async clearAll() {
      await repositories.payment.clear();
      await repositories.pixDetail.clear();
    },
  };
}

export type DSL = ReturnType<typeof createDSL>;
