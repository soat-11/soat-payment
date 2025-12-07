import { DefaultAxiosClient } from '@core/infra/http/client/defaulta-axios-client';
import { HttpClient } from '@core/infra/http/client/http-client';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';
import { Global, Module, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import axios from 'axios';

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
    {
      provide: HttpClient,
      useFactory: () => new DefaultAxiosClient(axios),
    },
  ],
  exports: [AbstractLoggerService, HttpClient],
})
export class CoreModule {}
