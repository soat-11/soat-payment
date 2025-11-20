import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: AbstractLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message:
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error',
    };

    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Global Exception Filter: ${responseBody.message}`,
        {
          error: exception,
          context: 'GlobalExceptionFilter',
          req: {
            method: httpAdapter.getRequestMethod(ctx.getRequest()),
            url: responseBody.path,
          },
        },
      );
    } else {
      this.logger.warn(
        `Global Exception Filter (Handled): ${responseBody.message}`,
        {
          error: exception,
          context: 'GlobalExceptionFilter',
          statusCode: httpStatus,
        },
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
