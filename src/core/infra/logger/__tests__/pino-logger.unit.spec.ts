import pino from 'pino';
import { PinoLoggerService } from '../pino-logger';

describe('PinoLoggerService - Unit Test', () => {
  let logger: PinoLoggerService;
  let mockPinoLogger: jest.Mocked<pino.Logger>;

  beforeEach(() => {
    mockPinoLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      level: 'info',
    } as unknown as jest.Mocked<pino.Logger>;

    logger = new PinoLoggerService(
      { suppressConsole: false },
      mockPinoLogger,
      'TestContext',
    );
  });

  describe('log', () => {
    it('should call pino info with message', () => {
      logger.log('Test message');

      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'TestContext' }),
        'Test message',
      );
    });

    it('should include extra params in log', () => {
      logger.log('Test message', { userId: 123 });

      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          context: 'TestContext',
          extra: { userId: 123 },
        }),
        'Test message',
      );
    });
  });

  describe('error', () => {
    it('should call pino error with message', () => {
      logger.error('Error message');

      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'TestContext' }),
        'Error message',
      );
    });

    it('should include extra params in error log', () => {
      logger.error('Error message', { errorCode: 'ERR001' });

      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          context: 'TestContext',
          extra: { errorCode: 'ERR001' },
        }),
        'Error message',
      );
    });
  });

  describe('warn', () => {
    it('should call pino warn with message', () => {
      logger.warn('Warning message');

      expect(mockPinoLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'TestContext' }),
        'Warning message',
      );
    });
  });

  describe('debug', () => {
    it('should call pino debug with message', () => {
      logger.debug('Debug message');

      expect(mockPinoLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'TestContext' }),
        'Debug message',
      );
    });
  });

  describe('verbose', () => {
    it('should call pino trace with message', () => {
      logger.verbose('Verbose message');

      expect(mockPinoLogger.trace).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'TestContext' }),
        'Verbose message',
      );
    });
  });

  describe('fatal', () => {
    it('should call pino error with message', () => {
      logger.fatal('Fatal message');

      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'TestContext' }),
        'Fatal message',
      );
    });
  });

  describe('setContext', () => {
    it('should update context', () => {
      logger.setContext('NewContext');

      expect(logger.context).toBe('NewContext');
    });

    it('should use new context in subsequent logs', () => {
      logger.setContext('UpdatedContext');
      logger.log('Message after context change');

      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'UpdatedContext' }),
        'Message after context change',
      );
    });
  });

  describe('getLogLevel', () => {
    it('should return correct log level mapping', () => {
      const levels = logger.getLogLevel();

      expect(levels).toEqual({
        error: 'error',
        warn: 'warn',
        info: 'info',
        debug: 'debug',
        trace: 'trace',
      });
    });
  });

  describe('suppressConsole', () => {
    it('should not log when suppressConsole is true', () => {
      const suppressedLogger = new PinoLoggerService(
        { suppressConsole: true },
        mockPinoLogger,
        'SuppressedContext',
      );

      suppressedLogger.log('This should not be logged');
      suppressedLogger.error('This error should not be logged');
      suppressedLogger.warn('This warning should not be logged');

      expect(mockPinoLogger.info).not.toHaveBeenCalled();
      expect(mockPinoLogger.error).not.toHaveBeenCalled();
      expect(mockPinoLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('unwrapError', () => {
    it('should return message from Error instance', () => {
      const error = new Error('Test error message');
      const result = logger.unwrapError(error);
      expect(result).toBe('Test error message');
    });

    it('should return string as is', () => {
      const result = logger.unwrapError('String error');
      expect(result).toBe('String error');
    });

    it('should stringify object errors', () => {
      const result = logger.unwrapError({ code: 'ERR', details: 'info' });
      expect(result).toBe('{"code":"ERR","details":"info"}');
    });
  });

  describe('handleWarning', () => {
    it('should call warn method', () => {
      logger.handleWarning('Warning via handler');

      expect(mockPinoLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'TestContext' }),
        'Warning via handler',
      );
    });
  });

  describe('handleError', () => {
    it('should call error method', () => {
      logger.handleError('Error via handler');

      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'TestContext' }),
        'Error via handler',
      );
    });
  });
});
