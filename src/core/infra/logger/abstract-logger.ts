export type LogContext = {
  originClass: string;
  originMethod: string;
};

export type LogExtra = {
  defaultContext?: LogContext;
  [key: string]: unknown;
};

export type Config = {
  suppressConsole?: boolean;
};

export type LoggerParams = {
  extra: LogExtra;
  context?: string;
  trace?: string;
};

export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'trace';

export type BaseLogMeta = {
  defaultContext: {
    originClass: string;
    originMethod: string;
  };
  context?: string;
  [key: string]: unknown;
};

export abstract class AbstractLoggerService<TLogLevel = string> {
  protected context?: string;

  constructor(protected readonly config?: Config) {}

  abstract log(message: string, ...optionalParams: unknown[]): void;
  abstract error(message: string, ...optionalParams: unknown[]): void;
  abstract warn(message: string, ...optionalParams: unknown[]): void;
  abstract debug(message: string, ...optionalParams: unknown[]): void;
  abstract verbose(message: string, ...optionalParams: unknown[]): void;

  abstract setContext(context: string): void;
  abstract getLogLevel(): Record<LogLevel, TLogLevel>;

  protected handleLog(
    level: LogLevel,
    message: string,
    extra: LogExtra,
    context?: string,
    trace?: string,
  ): void {
    if (this.config?.suppressConsole) return;
    this._handle(level, message, extra, context, trace);
  }

  protected abstract _handle(
    level: LogLevel,
    message: string,
    extra: LogExtra,
    context?: string,
    trace?: string,
  ): void;

  handleWarning(message: string): void {
    this.warn(message);
  }

  handleError(message: string, trace?: string): void {
    this.error(message, ...(trace ? [{ trace }] : []));
  }

  protected getCallerContext(exception?: unknown): LogContext {
    const stack =
      exception instanceof Error ? exception.stack : new Error().stack;

    const caller = stack?.split('\n')[6]?.trim()?.split(' ').at(1) ?? 'unknown';

    const callerClass = caller?.split('.').at(0) ?? 'unknown';

    const callerMethod = caller?.split('.').slice(1).join('.') ?? 'unknown';
    return { originClass: callerClass, originMethod: callerMethod };
  }

  protected getDefaultFields(exception?: unknown): LogExtra {
    const { originClass, originMethod } = this.getCallerContext(exception);
    return { defaultContext: { originClass, originMethod } };
  }

  protected parseParams(params: unknown[]): {
    extra: LogExtra;
    context?: string;
    trace?: string;
  } {
    const extra =
      (params.find((p) => typeof p === 'object' && p !== null) as LogExtra) ??
      {};
    const context = this.context ?? params.find((p) => typeof p === 'string');
    const trace = params.find((p) => typeof p === 'string' && p !== context) as
      | string
      | undefined;
    return { extra, context, trace };
  }

  public unwrapError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return JSON.stringify(error);
  }
}
