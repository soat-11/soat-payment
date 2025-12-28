import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentMongoDBEntity } from '@payment/infra/persistence/entities/payment-mongodb.entity';
import { PixDetailMongoDBEntity } from '@payment/infra/persistence/entities/pix-detail-mongodb.entity';

const writeConcern = process.env.MONGODB_WRITE_CONCERN
  ? parseInt(process.env.MONGODB_WRITE_CONCERN)
  : 1;

@Module({
  imports: [
    TypeOrmModule.forRoot({
      url: process.env.MONGODB_URI,
      type: 'mongodb',
      entities: [PaymentMongoDBEntity, PixDetailMongoDBEntity],
      synchronize: process.env.NODE_ENV !== 'production',
      writeConcern: {
        w: writeConcern ?? 1,
        j: true,
        wtimeout: 2000,
      },
    }),
    TypeOrmModule.forFeature([PaymentMongoDBEntity, PixDetailMongoDBEntity]),
  ],
  exports: [TypeOrmModule],
})
export class MongoModule {}
