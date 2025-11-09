import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainBusinessException,
  DomainValidationException,
  DomainNotFoundException,
  DomainConflictException,
  DomainPersistenceException,
  DomainException,
} from '@core/domain/exceptions/domain.exception';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = this.getHttpStatus(exception);
    const message = exception.message;

    response.status(status).json({
      statusCode: status,
      message,
      error: this.getErrorName(status),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getHttpStatus(exception: DomainException): number {
    if (exception instanceof DomainBusinessException) {
      return HttpStatus.BAD_REQUEST;
    }
    if (exception instanceof DomainValidationException) {
      return HttpStatus.UNPROCESSABLE_ENTITY;
    }
    if (exception instanceof DomainNotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof DomainConflictException) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof DomainPersistenceException) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorName(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      default:
        return 'Unknown Error';
    }
  }
}
