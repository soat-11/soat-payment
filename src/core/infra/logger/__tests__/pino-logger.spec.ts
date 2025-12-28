import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CoreModule } from '@/core/core.module';
import { AbstractLoggerService } from '@/core/infra/logger/abstract-logger';
import { PinoLoggerService } from '@/core/infra/logger/pino-logger';

@Injectable()
class TestService {
  constructor(public readonly logger: AbstractLoggerService) {}

  someAction() {
    this.logger.log('action executed');
  }
}

describe('Logger Integration (INQUIRER Scope)', () => {
  let moduleRef: TestingModule;
  let testService: TestService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CoreModule],
      providers: [TestService],
    }).compile();

    testService = moduleRef.get<TestService>(TestService);
  });

  it('should inject logger with context derived from the consuming class name', () => {
    expect(testService.logger).toBeInstanceOf(PinoLoggerService);


    const pinoLogger = testService.logger

    expect(pinoLogger.context).toBe('TestService');
  });

  it('should maintain correct context when logging', () => {
    const pinoLogger = testService.logger;


    expect(pinoLogger.context).toBeDefined();
    expect(pinoLogger.context).not.toBe('unknown');
    expect(pinoLogger.context).toBe('TestService');

  });
});
