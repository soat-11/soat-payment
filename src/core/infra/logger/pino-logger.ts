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
  ) {
    super({ suppressConsole: config?.suppressConsole || false });
    const level = process.env.LOG_LEVEL || 'info';
    const options: LoggerOptions = {
      level,
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: true },
            }
          : undefined,
    };
    this.logger = loggerInstance || pino(options);
  }
  fatal(message: string, ...optionalParams: any[]) {
    const { extra, context, trace } = this.parseParams(optionalParams);
    this.handleLog('error', message, extra, context, trace);
  }

  setContext(context: string): void {
    this.context = context;
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
    context?: string,
    trace?: string,
  ): void {
    const teste = this.getDefaultFields(trace ? new Error(trace) : undefined);
    const traceId = this.getTraceIdFromContext();
    const base: BaseLogMeta & { traceId?: string } = {
      defaultContext: {
        originClass: teste.defaultContext?.originClass ?? 'unknown',
        originMethod: teste.defaultContext?.originMethod ?? 'unknown',
      },
      context,
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
