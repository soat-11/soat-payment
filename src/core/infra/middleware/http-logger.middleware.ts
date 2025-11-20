import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AbstractLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, query, params, ip } = req;
    const startTime = Date.now();


    this.logger.log(`Incoming Request: ${method} ${originalUrl}`, {
      req: {
        method,
        url: originalUrl,
        body,
        query,
        params,
        ip,
      },
      context: 'HttpLoggerMiddleware',
    });

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;


      this.logger.log(`Outgoing Response: ${method} ${originalUrl} ${statusCode}`, {
        res: {
          statusCode,
          duration: `${duration}ms`,
        },
        context: 'HttpLoggerMiddleware',
      });
    });

    next();
  }
}
