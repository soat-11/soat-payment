import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { AnyPaymentDetail } from '@payment/domain/value-objects/payment-detail.vo';
import { PaymentDetailMapper } from './payment-detail.mapper.interface';
import { Result } from '@core/domain/result';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';
import { PixDetailMongoDBEntity } from '@payment/infra/persistence/entities/pix-detail-mongodb.entity';
import { MongoRepository } from 'typeorm';
import { DefaultMongoDBEntity } from '@core/infra/database/mongodb/default-mongodb.entity';

export class PaymentDetailMapperFactory {
  private mappers = new Map<
    PaymentType,
    PaymentDetailMapper<PixDetailMongoDBEntity, AnyPaymentDetail>
  >();

  private repositories = new Map<
    PaymentType,
    MongoRepository<DefaultMongoDBEntity>
  >();

  registerMapper(
    mapper: PaymentDetailMapper<PixDetailMongoDBEntity, AnyPaymentDetail>,
    repository: MongoRepository<DefaultMongoDBEntity>,
  ): void {
    this.mappers.set(mapper.supportedType, mapper);
    this.repositories.set(mapper.supportedType, repository);
  }

  getRepository(type: PaymentType): Result<MongoRepository<DefaultMongoDBEntity>> {
    const repository = this.repositories.get(type);
    if (!repository) {
      return Result.fail(
        new DomainBusinessException(
          `Repository não encontrado para tipo de pagamento: ${type}`,
        ),
      );
    }
    return Result.ok(repository);
  }

  getMapper(
    type: PaymentType,
  ): Result<PaymentDetailMapper<PixDetailMongoDBEntity, AnyPaymentDetail>> {
    const mapper = this.mappers.get(type);
    if (!mapper) {
      return Result.fail(
        new DomainBusinessException(
          `Mapper não encontrado para tipo de pagamento: ${type}`,
        ),
      );
    }
    return Result.ok(mapper);
  }

  toORM(detail: AnyPaymentDetail, paymentId: string): Result<any> {
    const mapperResult = this.getMapper(detail.paymentType);
    if (mapperResult.isFailure) {
      return Result.fail(mapperResult.error);
    }

    return mapperResult.value.toORM(detail, paymentId);
  }

  toDomain(orm: any, type: PaymentType): Result<AnyPaymentDetail> {
    const mapperResult = this.getMapper(type);
    if (mapperResult.isFailure) {
      return Result.fail(mapperResult.error);
    }

    return mapperResult.value.toDomain(orm);
  }
}
