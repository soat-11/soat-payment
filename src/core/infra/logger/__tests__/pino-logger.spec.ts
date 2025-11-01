import '@core/infra/instrumentation';
import { PinoLoggerService } from '../pino-logger';
import { context, trace } from '@opentelemetry/api';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';

describe('PinoLoggerService OpenTelemetry integration', () => {
  it('should log with real OpenTelemetry traceId', () => {
    const provider = new BasicTracerProvider();
    const tracer = provider.getTracer('test');

    const span = tracer.startSpan('test-span');
    context.with(trace.setSpan(context.active(), span), () => {
      const service = new PinoLoggerService({ suppressConsole: false });
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
      expect(contextObj).toHaveProperty(
        'defaultContext.originMethod',
        'create',
      );
      expect(contextObj).toHaveProperty('traceId', span.spanContext().traceId);

      span.end();
    });
  });
});
