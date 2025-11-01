import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: AbstractLoggerService,
      useClass: PinoLoggerService,
    },
  ],
  exports: [AbstractLoggerService],
})
export class CoreModule {}
