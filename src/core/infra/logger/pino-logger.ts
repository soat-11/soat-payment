import { context, trace } from '@opentelemetry/api';
import pino, { Logger as PinoBaseLogger, LoggerOptions } from 'pino';
import {
  AbstractLoggerService,
  BaseLogMeta,
  Config,
  LogExtra,
  LogLevel,
} from '@core/infra/logger/abstract-logger';

export class PinoLoggerService extends AbstractLoggerService<pino.Level> {
  private readonly logger: PinoBaseLogger;

  constructor(
    config: Config = { suppressConsole: process.env.NODE_ENV === 'test' },
    loggerInstance?: PinoBaseLogger,
    context?: string,
  ) {
    super({ suppressConsole: config?.suppressConsole || false });
    this._context = context;

    const level = process.env.LOG_LEVEL || 'info';
    const options: LoggerOptions = {
      level,
      transport: this.handleTransport().transport,
    };

    this.logger = loggerInstance || pino(options);
  }

  private handleTransport(): Pick<LoggerOptions, 'transport'> {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      return {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: true,
            ignore: 'pid,hostname',
          },
        },
      };
    }

    return {
      transport: undefined,
    };
  }

  fatal(message: string, ...optionalParams: any[]) {
    const { extra, context, trace } = this.parseParams(optionalParams);
    this.handleLog('error', message, extra, context, trace);
  }

  setContext(context: string): void {
    this._context = context;
  }

  setLogLevels(levels: string[]): void {
    this.logger.level = levels[0] ?? 'info';
  }

  log(message: string, ...optionalParams: unknown[]): void {
    const { extra, context } = this.parseParams(optionalParams);
    this.handleLog('info', message, extra, context);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    const { extra, context, trace } = this.parseParams(optionalParams);
    this.handleLog('error', message, extra, context, trace);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    const { extra, context } = this.parseParams(optionalParams);
    this.handleLog('warn', message, extra, context);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    const { extra, context } = this.parseParams(optionalParams);
    this.handleLog('debug', message, extra, context);
  }

  verbose(message: string, ...optionalParams: unknown[]): void {
    const { extra, context } = this.parseParams(optionalParams);
    this.handleLog('trace', message, extra, context);
  }

  getLogLevel(): Record<LogLevel, pino.Level> {
    return {
      error: 'error',
      warn: 'warn',
      info: 'info',
      debug: 'debug',
      trace: 'trace',
    };
  }

  protected _handle(
    level: LogLevel,
    message: string,
    extra: LogExtra,
  ): void {

    const traceId = this.getTraceIdFromContext();
    const base: BaseLogMeta & { traceId?: string } = {
      context: this.context,
      extra,
      traceId: traceId,
    };

    const handleLevel = this.getLogLevel()[level];

    this.logger[handleLevel](base, message);
  }

  getTraceIdFromContext(): string | undefined {
    const span = trace.getSpan(context.active());
    return span?.spanContext().traceId;
  }
}
