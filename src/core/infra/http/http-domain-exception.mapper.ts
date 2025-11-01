import { DomainException } from '@core/domain/exceptions/domain.exception';

export type DomainExceptionMapperType = {
  statusCode: number;
  message: string;
};

export interface HttpDomainExceptionMapper {
  map(exception: DomainException | unknown): DomainExceptionMapperType;
}
