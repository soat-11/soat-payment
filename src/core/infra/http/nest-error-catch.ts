import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { ErrorMap } from './error-map';

const errorMap = new ErrorMap();

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const { message, statusCode } = errorMap.map(exception);
    res.status(statusCode).json({ error: message });
  }
}
