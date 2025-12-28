import {
  AbstractLoggerService,
  LogExtra,
  LogLevel,
} from '@core/infra/logger/abstract-logger';

export type LogEntry = {
  message: string;
  context?: object;
};

export class FakeLogger extends AbstractLoggerService {
  logs: LogEntry[] = [];
  errors: LogEntry[] = [];
  warnings: LogEntry[] = [];

  log(message: string, context?: object): void {
    this.logs.push({ message, context });
  }

  error(message: string, context?: object): void {
    this.errors.push({ message, context });
  }

  warn(message: string, context?: object): void {
    this.warnings.push({ message, context });
  }

  debug(): void {}
  verbose(): void {}
  setContext(): void {}

  getLogLevel(): Record<LogLevel, string> {
    return {
      info: 'info',
      error: 'error',
      warn: 'warn',
      debug: 'debug',
      trace: 'trace',
    };
  }

  getTraceIdFromContext(): string | undefined {
    return undefined;
  }

  protected _handle(
    _level: LogLevel,
    _message: string,
    _extra: LogExtra,
    _context?: string,
    _trace?: string,
  ): void {}

  clear(): void {
    this.logs = [];
    this.errors = [];
    this.warnings = [];
  }

  hasLog(message: string): boolean {
    return this.logs.some((log) => log.message === message);
  }

  hasError(message: string): boolean {
    return this.errors.some((log) => log.message === message);
  }
}
