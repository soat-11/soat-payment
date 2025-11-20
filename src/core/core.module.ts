import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { Global, Module, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Global()
@Module({
  providers: [
    {
      provide: AbstractLoggerService,
      useFactory: (parentClass: object) => {
        return new PinoLoggerService(
          { suppressConsole: process.env.NODE_ENV === 'test' },
          undefined,
          parentClass?.constructor?.name,
        );
      },
      inject: [INQUIRER],
      scope: Scope.TRANSIENT,
    },
  ],
  exports: [AbstractLoggerService],
})
export class CoreModule {}
