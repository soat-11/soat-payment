import {
  DomainConflictException,
  DomainException,
  DomainForbiddenException,
  DomainNotFoundException,
  DomainUnauthorizedException,
  DomainValidationException,
  DomainBusinessException,
} from '@core/domain/exceptions/domain.exception';
import {
  DomainExceptionMapperType,
  HttpDomainExceptionMapper,
} from './http-domain-exception.mapper';

export class ErrorMap implements HttpDomainExceptionMapper {
  map(exception: DomainException | unknown): DomainExceptionMapperType {
    if (exception instanceof DomainNotFoundException) {
      return { statusCode: 404, message: exception.message };
    }
    if (exception instanceof DomainValidationException) {
      return { statusCode: 400, message: exception.message };
    }
    if (exception instanceof DomainConflictException) {
      return { statusCode: 409, message: exception.message };
    }
    if (exception instanceof DomainUnauthorizedException) {
      return { statusCode: 401, message: exception.message };
    }
    if (exception instanceof DomainForbiddenException) {
      return { statusCode: 403, message: exception.message };
    }
    if (exception instanceof DomainBusinessException) {
      return { statusCode: 422, message: exception.message };
    }

    return { statusCode: 500, message: 'Internal Server Error' };
  }
}
