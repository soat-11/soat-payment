import { Logger } from '@nestjs/common';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';

if (process.env.NODE_ENV !== 'production') {
  Logger.log('Setting up console logger');
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

export class InstrumentationService {
  private static sdk: NodeSDK;

  static initialize() {
    this.sdk = new NodeSDK({
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          '@opentelemetry/instrumentation-http': {
            ignoreIncomingRequestHook: (req) => {
              return Boolean(
                req.url?.includes('/health') || req.url?.includes('/metrics'),
              );
            },
          },
          '@opentelemetry/instrumentation-mongodb': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-pino': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
        }),
      ],
    });

    return this.sdk;
  }

  static async start() {
    try {
      if (!this.sdk) {
        this.initialize();
      }
      await this.sdk.start();
      Logger.log('OpenTelemetry started → Logs/Traces/Metrics enabled');
    } catch (error) {
      Logger.warn(
        'OpenTelemetry failed to start - Logs only in console',
        error,
      );
      Logger.error(error);
    }
  }

  static async shutdown() {
    if (this.sdk) {
      await this.sdk.shutdown();
      Logger.log('OpenTelemetry SDK shutdown');
    }
  }
}

InstrumentationService.initialize();
InstrumentationService.start().catch((error) => {
  Logger.error('Failed to start OpenTelemetry:', error);
});
