import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMongoDBEntity } from '@payment/infra/persistence/entities/payment-mongodb.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      url: process.env.MONGODB_URI,
      type: 'mongodb',
      entities: [PaymentMongoDBEntity],
      synchronize: true,
      writeConcern: {
        w: 2,
        j: true,
        wtimeout: 2000,
      },
    }),
  ],
})
export class MongoModule {}
