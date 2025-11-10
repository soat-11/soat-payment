import { Injectable } from '@nestjs/common';
import { PaymentType } from '@payment/domain/enum/payment-type.enum';
import { AnyPaymentDetail } from '@payment/domain/value-objects/payment-detail.vo';
import { PaymentDetailMapper } from './payment-detail.mapper.interface';
import { Result } from '@core/domain/result';
import { DomainBusinessException } from '@core/domain/exceptions/domain.exception';

export class PaymentDetailMapperFactory {
  private mappers = new Map<
    PaymentType,
    PaymentDetailMapper<any, AnyPaymentDetail>
  >();

  registerMapper(mapper: PaymentDetailMapper<any, AnyPaymentDetail>): void {
    this.mappers.set(mapper.supportedType, mapper);
  }

  getMapper(
    type: PaymentType,
  ): Result<PaymentDetailMapper<any, AnyPaymentDetail>> {
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
