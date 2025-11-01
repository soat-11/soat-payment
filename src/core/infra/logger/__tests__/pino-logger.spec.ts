import { PinoLoggerService } from '../pino-logger';

describe('PinoLoggerService basic logging', () => {
  it('should pass message and optionalParams to logger.info', () => {
    const service = new PinoLoggerService({
      suppressConsole: false,
    });

    const loggerSpy = jest.spyOn(service['logger'], 'error');

    class ErrorTest {
      create() {
        service.error('test message');
      }
    }

    const errorTest = new ErrorTest();
    errorTest.create();

    expect(loggerSpy).toHaveBeenCalled();

    const [contextObj, message] = loggerSpy.mock.calls[0];

    expect(message).toBe('test message');
    expect(contextObj).toHaveProperty(
      'defaultContext.originClass',
      'ErrorTest',
    );
    expect(contextObj).toHaveProperty('defaultContext.originMethod', 'create');
  });
});
