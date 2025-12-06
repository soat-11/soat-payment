import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { FakeLogger } from '@test/fakes/fake-logger';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DlqMessageContext,
  SqsConsumer,
  SqsConsumerOptions,
  SQSRawMessage,
} from '../sqs-consumer';

type TestPayload = {
  id: string;
  data: string;
};

class TestSqsConsumer extends SqsConsumer<TestPayload> {
  public handleMessageSpy = jest.fn<Promise<void>, [TestPayload]>();
  private _dlqUrl: string | null = null;

  constructor(
    logger: FakeLogger,
    queueUrlEnvVar: string,
    options: SqsConsumerOptions = {},
  ) {
    super(logger, queueUrlEnvVar, options);
  }

  async handleMessage(payload: TestPayload): Promise<void> {
    return this.handleMessageSpy(payload);
  }

  setDlqUrl(url: string | null): void {
    this._dlqUrl = url;
  }

  protected override get dlqUrl(): string | null {
    return this._dlqUrl;
  }

  public callStart(): void {
    this.start();
  }

  public callStop(): void {
    this.stop();
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  public getQueueUrlValue(): string {
    return this.getQueueUrl();
  }

  public getSqsClient(): SQSClient {
    return this.getClient();
  }

  public callSendToDlq(message: TestPayload, error: Error): Promise<boolean> {
    return this.sendToDlq(message, error);
  }

  public callIsValidMessage(message: unknown): boolean {
    return (this as any).isValidMessage(message);
  }

  public callParseMessagePayload(message: SQSRawMessage): TestPayload | null {
    return (this as any).parseMessagePayload(message);
  }

  public callProcessMessage(message: unknown): Promise<void> {
    return (this as any).processMessage(message);
  }
}

describe('SqsConsumer', () => {
  let logger: FakeLogger;
  let sqsMock: ReturnType<typeof mockClient>;
  let activeConsumers: TestSqsConsumer[] = [];

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = new FakeLogger();
    sqsMock = mockClient(SQSClient);
    activeConsumers = [];

    process.env = {
      ...originalEnv,
      AWS_REGION: 'us-east-1',
      AWS_ENDPOINT: 'http://localhost:4566',
      AWS_ACCESS_KEY_ID: 'test-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret',
      TEST_QUEUE_URL: 'http://localhost:4566/queue/test-queue',
      TEST_DLQ_URL: 'http://localhost:4566/queue/test-dlq',
    };
  });

  afterEach(() => {
    activeConsumers.forEach((consumer) => {
      try {
        if (consumer.getIsRunning()) {
          consumer.callStop();
        }
      } catch {}
    });
    activeConsumers = [];
    process.env = originalEnv;
    sqsMock.reset();
    sqsMock.restore();
  });

  const createConsumer = (
    queueUrlEnvVar: string,
    options?: SqsConsumerOptions,
  ): TestSqsConsumer => {
    const consumer = new TestSqsConsumer(logger, queueUrlEnvVar, options);
    activeConsumers.push(consumer);
    return consumer;
  };

  describe('Constructor', () => {
    describe('Success Cases', () => {
      it('should initialize with valid queue URL from environment', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');

        expect(consumer.getQueueUrlValue()).toBe(
          'http://localhost:4566/queue/test-queue',
        );
        expect(consumer.getSqsClient()).toBeInstanceOf(SQSClient);
        expect(logger.warnings).toHaveLength(0);
      });

      it('should merge custom options with defaults', () => {
        const consumer = createConsumer('TEST_QUEUE_URL', {
          batchSize: 5,
          visibilityTimeout: 60,
        });

        expect(consumer).toBeDefined();
        expect(consumer.getQueueUrlValue()).toBe(
          'http://localhost:4566/queue/test-queue',
        );
      });

      it('should create SQS client with endpoint when AWS_ENDPOINT is set', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');
        const client = consumer.getSqsClient();

        expect(client).toBeInstanceOf(SQSClient);
      });

      it('should create SQS client without endpoint when AWS_ENDPOINT is not set', () => {
        delete process.env.AWS_ENDPOINT;

        const consumer = createConsumer('TEST_QUEUE_URL');

        expect(consumer.getSqsClient()).toBeInstanceOf(SQSClient);
      });
    });

    describe('Failure Cases', () => {
      it('should warn when queue URL environment variable does not exist', () => {
        const consumer = createConsumer('NON_EXISTENT_QUEUE');

        expect(consumer.getQueueUrlValue()).toBe('');
        expect(logger.warnings).toHaveLength(1);
        expect(logger.warnings[0].message).toContain(
          'Queue URL not found in environment variable: NON_EXISTENT_QUEUE',
        );
      });
    });

    describe('Edge Cases', () => {
      it('should use default credentials when not provided in environment', () => {
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;

        const consumer = createConsumer('TEST_QUEUE_URL');

        expect(consumer.getSqsClient()).toBeInstanceOf(SQSClient);
      });

      it('should handle empty queue URL environment variable', () => {
        process.env.EMPTY_QUEUE_URL = '';

        const consumer = createConsumer('EMPTY_QUEUE_URL');

        expect(consumer.getQueueUrlValue()).toBe('');
        expect(logger.warnings).toHaveLength(1);
      });
    });
  });

  describe('Lifecycle Methods', () => {
    describe('onModuleInit', () => {
      describe('Success Cases', () => {
        it('should call start when queue URL is configured', async () => {
          const consumer = createConsumer('TEST_QUEUE_URL');
          const startSpy = jest.spyOn(consumer as any, 'start');

          await consumer.onModuleInit();

          expect(startSpy).toHaveBeenCalled();
        });
      });

      describe('Edge Cases', () => {
        it('should not call start when queue URL is empty', async () => {
          const consumer = createConsumer('NON_EXISTENT_QUEUE');
          const startSpy = jest.spyOn(consumer as any, 'start');

          await consumer.onModuleInit();

          expect(startSpy).not.toHaveBeenCalled();
        });
      });
    });

    describe('onModuleDestroy', () => {
      describe('Success Cases', () => {
        it('should call stop on destroy', () => {
          const consumer = createConsumer('TEST_QUEUE_URL');
          const stopSpy = jest.spyOn(consumer as any, 'stop');

          consumer.onModuleDestroy();

          expect(stopSpy).toHaveBeenCalled();
        });
      });
    });
  });

  describe('start', () => {
    describe('Success Cases', () => {
      it('should initialize and set isRunning to true', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');

        consumer.callStart();

        expect(consumer.getIsInitialized()).toBe(true);
        expect(consumer.getIsRunning()).toBe(true);
        expect(
          logger.logs.some((l) => l.message.includes('Consumer initialized')),
        ).toBe(true);
      });

      it('should not reinitialize if already initialized', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');
        consumer.callStart();
        consumer.callStop();
        logger.clear();

        consumer.callStart();

        const initLogs = logger.logs.filter((l) =>
          l.message.includes('Consumer initialized'),
        );
        expect(initLogs).toHaveLength(0);
      });
    });

    describe('Failure Cases', () => {
      it('should not start if queue URL is not configured', () => {
        const consumer = createConsumer('NON_EXISTENT_QUEUE');

        consumer.callStart();

        expect(consumer.getIsRunning()).toBe(false);
        expect(consumer.getIsInitialized()).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should warn if already running', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');
        consumer.callStart();
        logger.clear();

        consumer.callStart();

        expect(
          logger.warnings.some((w) => w.message.includes('already running')),
        ).toBe(true);
      });
    });
  });

  describe('stop', () => {
    describe('Success Cases', () => {
      it('should stop running consumer', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');
        consumer.callStart();

        consumer.callStop();

        expect(consumer.getIsRunning()).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should do nothing if consumer not initialized', () => {
        const consumer = createConsumer('NON_EXISTENT_QUEUE');

        expect(() => consumer.callStop()).not.toThrow();
      });

      it('should warn if not running', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');
        consumer.callStart();
        consumer.callStop();
        logger.clear();

        consumer.callStop();

        expect(
          logger.warnings.some((w) => w.message.includes('not running')),
        ).toBe(true);
      });
    });
  });

  describe('isValidMessage', () => {
    let consumer: TestSqsConsumer;

    beforeEach(() => {
      consumer = createConsumer('TEST_QUEUE_URL');
    });

    describe('Success Cases', () => {
      it('should return true for valid message with Body and ReceiptHandle', () => {
        const message: SQSRawMessage = {
          Body: '{"id": "1", "data": "test"}',
          ReceiptHandle: 'receipt-123',
        };

        expect(consumer.callIsValidMessage(message)).toBe(true);
      });

      it('should return true for message with optional MessageId', () => {
        const message: SQSRawMessage = {
          Body: '{"id": "1", "data": "test"}',
          ReceiptHandle: 'receipt-123',
          MessageId: 'msg-123',
        };

        expect(consumer.callIsValidMessage(message)).toBe(true);
      });
    });

    describe('Failure Cases', () => {
      it('should return false for null', () => {
        expect(consumer.callIsValidMessage(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(consumer.callIsValidMessage(undefined)).toBe(false);
      });

      it('should return false for non-object', () => {
        expect(consumer.callIsValidMessage('string')).toBe(false);
        expect(consumer.callIsValidMessage(123)).toBe(false);
        expect(consumer.callIsValidMessage(true)).toBe(false);
      });

      it('should return false for message without Body', () => {
        expect(
          consumer.callIsValidMessage({ ReceiptHandle: 'receipt-123' }),
        ).toBe(false);
      });

      it('should return false for message without ReceiptHandle', () => {
        expect(consumer.callIsValidMessage({ Body: '{}' })).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should return false for non-string Body', () => {
        expect(
          consumer.callIsValidMessage({
            Body: 123,
            ReceiptHandle: 'receipt-123',
          }),
        ).toBe(false);
      });

      it('should return false for non-string ReceiptHandle', () => {
        expect(
          consumer.callIsValidMessage({ Body: '{}', ReceiptHandle: 123 }),
        ).toBe(false);
      });

      it('should return false for empty object', () => {
        expect(consumer.callIsValidMessage({})).toBe(false);
      });

      it('should return true for empty string Body (valid format)', () => {
        expect(
          consumer.callIsValidMessage({
            Body: '',
            ReceiptHandle: 'receipt-123',
          }),
        ).toBe(true);
      });
    });
  });

  describe('parseMessagePayload', () => {
    let consumer: TestSqsConsumer;

    beforeEach(() => {
      consumer = createConsumer('TEST_QUEUE_URL');
    });

    describe('Success Cases', () => {
      it('should parse valid JSON payload', () => {
        const message: SQSRawMessage = {
          Body: JSON.stringify({ id: '123', data: 'test-data' }),
          ReceiptHandle: 'receipt-123',
        };

        const result = consumer.callParseMessagePayload(message);

        expect(result).toEqual({ id: '123', data: 'test-data' });
      });

      it('should parse nested JSON objects', () => {
        const payload = {
          id: '123',
          data: 'test',
          nested: { key: 'value' },
          array: [1, 2, 3],
        };
        const message: SQSRawMessage = {
          Body: JSON.stringify(payload),
          ReceiptHandle: 'receipt-123',
        };

        const result = consumer.callParseMessagePayload(message);

        expect(result).toEqual(payload);
      });
    });

    describe('Failure Cases', () => {
      it('should return null for invalid JSON', () => {
        const message: SQSRawMessage = {
          Body: 'invalid-json',
          ReceiptHandle: 'receipt-123',
        };

        const result = consumer.callParseMessagePayload(message);

        expect(result).toBeNull();
        expect(
          logger.errors.some((e) =>
            e.message.includes('Error parsing message payload'),
          ),
        ).toBe(true);
      });

      it('should return null for truncated JSON', () => {
        const message: SQSRawMessage = {
          Body: '{"id": "123", "data":',
          ReceiptHandle: 'receipt-123',
        };

        const result = consumer.callParseMessagePayload(message);

        expect(result).toBeNull();
      });
    });

    describe('Edge Cases', () => {
      it('should parse empty object', () => {
        const message: SQSRawMessage = {
          Body: '{}',
          ReceiptHandle: 'receipt-123',
        };

        const result = consumer.callParseMessagePayload(message);

        expect(result).toEqual({});
      });

      it('should parse null value', () => {
        const message: SQSRawMessage = {
          Body: 'null',
          ReceiptHandle: 'receipt-123',
        };

        const result = consumer.callParseMessagePayload(message);

        expect(result).toBeNull();
      });

      it('should parse array payload', () => {
        const message: SQSRawMessage = {
          Body: '[1, 2, 3]',
          ReceiptHandle: 'receipt-123',
        };

        const result = consumer.callParseMessagePayload(message);

        expect(result).toEqual([1, 2, 3]);
      });
    });
  });

  describe('processMessage', () => {
    let consumer: TestSqsConsumer;

    beforeEach(() => {
      consumer = createConsumer('TEST_QUEUE_URL');
    });

    describe('Success Cases', () => {
      it('should process valid message and call handleMessage', async () => {
        const payload = { id: '123', data: 'test' };
        const message: SQSRawMessage = {
          Body: JSON.stringify(payload),
          ReceiptHandle: 'receipt-123',
          MessageId: 'msg-123',
        };
        consumer.handleMessageSpy.mockResolvedValueOnce(undefined);

        await consumer.callProcessMessage(message);

        expect(consumer.handleMessageSpy).toHaveBeenCalledWith(payload);
      });

      it('should complete without error when handleMessage succeeds', async () => {
        const message: SQSRawMessage = {
          Body: JSON.stringify({ id: '1', data: 'test' }),
          ReceiptHandle: 'receipt-123',
        };
        consumer.handleMessageSpy.mockResolvedValueOnce(undefined);

        await expect(
          consumer.callProcessMessage(message),
        ).resolves.toBeUndefined();
      });
    });

    describe('Failure Cases', () => {
      it('should throw error for invalid message format', async () => {
        const invalidMessage = { Body: null, ReceiptHandle: 'receipt-123' };

        await expect(
          consumer.callProcessMessage(invalidMessage),
        ).rejects.toThrow('Invalid message format');

        expect(
          logger.errors.some((e) =>
            e.message.includes('Invalid message format'),
          ),
        ).toBe(true);
      });

      it('should re-throw error from handleMessage when no DLQ configured', async () => {
        const message: SQSRawMessage = {
          Body: JSON.stringify({ id: '123', data: 'test' }),
          ReceiptHandle: 'receipt-123',
        };
        consumer.handleMessageSpy.mockRejectedValueOnce(
          new Error('Processing failed'),
        );

        await expect(consumer.callProcessMessage(message)).rejects.toThrow(
          'Processing failed',
        );

        expect(
          logger.errors.some((e) =>
            e.message.includes('Error in handleMessage'),
          ),
        ).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should discard poison pill message with invalid JSON (return without error)', async () => {
        const message: SQSRawMessage = {
          Body: 'invalid-json',
          ReceiptHandle: 'receipt-123',
          MessageId: 'msg-123',
        };

        await expect(
          consumer.callProcessMessage(message),
        ).resolves.toBeUndefined();

        expect(consumer.handleMessageSpy).not.toHaveBeenCalled();
        expect(
          logger.errors.some((e) =>
            e.message.includes('Failed to parse message payload'),
          ),
        ).toBe(true);
      });

      it('should send to DLQ and return successfully when DLQ is configured', async () => {
        consumer.setDlqUrl(process.env.TEST_DLQ_URL!);
        sqsMock.on(SendMessageCommand).resolves({});

        const message: SQSRawMessage = {
          Body: JSON.stringify({ id: '123', data: 'test' }),
          ReceiptHandle: 'receipt-123',
        };
        consumer.handleMessageSpy.mockRejectedValueOnce(
          new Error('Processing failed'),
        );

        await expect(
          consumer.callProcessMessage(message),
        ).resolves.toBeUndefined();

        expect(
          logger.logs.some((l) => l.message.includes('Message sent to DLQ')),
        ).toBe(true);
      });

      it('should re-throw error when DLQ send fails', async () => {
        consumer.setDlqUrl(process.env.TEST_DLQ_URL!);
        sqsMock.on(SendMessageCommand).rejects(new Error('DLQ send failed'));

        const message: SQSRawMessage = {
          Body: JSON.stringify({ id: '123', data: 'test' }),
          ReceiptHandle: 'receipt-123',
        };
        consumer.handleMessageSpy.mockRejectedValueOnce(
          new Error('Processing failed'),
        );

        await expect(consumer.callProcessMessage(message)).rejects.toThrow(
          'Processing failed',
        );

        expect(
          logger.errors.some((e) =>
            e.message.includes('Failed to send message to DLQ'),
          ),
        ).toBe(true);
      });
    });
  });

  describe('sendToDlq', () => {
    let consumer: TestSqsConsumer;

    beforeEach(() => {
      consumer = createConsumer('TEST_QUEUE_URL');
    });

    describe('Success Cases', () => {
      it('should send message to DLQ with correct format', async () => {
        consumer.setDlqUrl(process.env.TEST_DLQ_URL!);
        sqsMock.on(SendMessageCommand).resolves({});

        const payload = { id: '123', data: 'test' };
        const error = new Error('Test error');

        const result = await consumer.callSendToDlq(payload, error);

        expect(result).toBe(true);

        const sendCalls = sqsMock.commandCalls(SendMessageCommand);
        expect(sendCalls).toHaveLength(1);

        const sentBody = JSON.parse(
          sendCalls[0].args[0].input.MessageBody!,
        ) as DlqMessageContext<TestPayload>;

        expect(sentBody.originalMessage).toEqual(payload);
        expect(sentBody.error.name).toBe('Error');
        expect(sentBody.error.message).toBe('Test error');
        expect(sentBody.queueUrl).toBe(process.env.TEST_QUEUE_URL);
        expect(sentBody.consumerName).toBe('TestSqsConsumer');
        expect(sentBody.timestamp).toBeDefined();
      });

      it('should log success when message is sent to DLQ', async () => {
        consumer.setDlqUrl(process.env.TEST_DLQ_URL!);
        sqsMock.on(SendMessageCommand).resolves({});

        await consumer.callSendToDlq(
          { id: '1', data: 'test' },
          new Error('Error'),
        );

        expect(
          logger.logs.some((l) => l.message.includes('Message sent to DLQ')),
        ).toBe(true);
      });
    });

    describe('Failure Cases', () => {
      it('should return false when DLQ URL is not configured', async () => {
        const result = await consumer.callSendToDlq(
          { id: '123', data: 'test' },
          new Error('Test error'),
        );

        expect(result).toBe(false);
        expect(
          logger.warnings.some((w) =>
            w.message.includes('DLQ URL not configured'),
          ),
        ).toBe(true);
      });

      it('should return false and log error when SQS send fails', async () => {
        consumer.setDlqUrl(process.env.TEST_DLQ_URL!);
        sqsMock.on(SendMessageCommand).rejects(new Error('Network error'));

        const result = await consumer.callSendToDlq(
          { id: '123', data: 'test' },
          new Error('Test error'),
        );

        expect(result).toBe(false);
        expect(
          logger.errors.some((e) =>
            e.message.includes('Failed to send message to DLQ'),
          ),
        ).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should include error stack in DLQ message', async () => {
        consumer.setDlqUrl(process.env.TEST_DLQ_URL!);
        sqsMock.on(SendMessageCommand).resolves({});

        const error = new Error('Test error');
        await consumer.callSendToDlq({ id: '1', data: 'test' }, error);

        const sendCalls = sqsMock.commandCalls(SendMessageCommand);
        const sentBody = JSON.parse(
          sendCalls[0].args[0].input.MessageBody!,
        ) as DlqMessageContext<TestPayload>;

        expect(sentBody.error.stack).toBeDefined();
        expect(sentBody.error.stack).toContain('Error: Test error');
      });

      it('should handle complex payload in DLQ message', async () => {
        consumer.setDlqUrl(process.env.TEST_DLQ_URL!);
        sqsMock.on(SendMessageCommand).resolves({});

        const complexPayload = {
          id: '123',
          data: JSON.stringify({ nested: { deep: 'value' } }),
        };

        await consumer.callSendToDlq(complexPayload, new Error('Error'));

        const sendCalls = sqsMock.commandCalls(SendMessageCommand);
        const sentBody = JSON.parse(
          sendCalls[0].args[0].input.MessageBody!,
        ) as DlqMessageContext<TestPayload>;

        expect(sentBody.originalMessage).toEqual(complexPayload);
      });
    });
  });

  describe('Getters', () => {
    describe('isRunning', () => {
      it('should return false initially', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');

        expect(consumer.getIsRunning()).toBe(false);
      });

      it('should return true after start', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');
        consumer.callStart();

        expect(consumer.getIsRunning()).toBe(true);
      });

      it('should return false after stop', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');
        consumer.callStart();
        consumer.callStop();

        expect(consumer.getIsRunning()).toBe(false);
      });
    });

    describe('isInitialized', () => {
      it('should return false initially', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');

        expect(consumer.getIsInitialized()).toBe(false);
      });

      it('should return true after start (initialization happens in start)', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');
        consumer.callStart();

        expect(consumer.getIsInitialized()).toBe(true);
      });

      it('should remain true after stop', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');
        consumer.callStart();
        consumer.callStop();

        expect(consumer.getIsInitialized()).toBe(true);
      });
    });

    describe('getQueueUrl', () => {
      it('should return configured queue URL', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');

        expect(consumer.getQueueUrlValue()).toBe(process.env.TEST_QUEUE_URL);
      });

      it('should return empty string when not configured', () => {
        const consumer = createConsumer('NON_EXISTENT');

        expect(consumer.getQueueUrlValue()).toBe('');
      });
    });

    describe('getClient', () => {
      it('should return SQS client instance', () => {
        const consumer = createConsumer('TEST_QUEUE_URL');

        expect(consumer.getSqsClient()).toBeInstanceOf(SQSClient);
      });
    });
  });

  describe('Integration Scenarios', () => {
    describe('Full Message Processing Flow', () => {
      it('should process message end-to-end successfully', async () => {
        const consumer = createConsumer('TEST_QUEUE_URL');
        consumer.handleMessageSpy.mockResolvedValueOnce(undefined);

        const message: SQSRawMessage = {
          Body: JSON.stringify({ id: 'integration-test', data: 'full-flow' }),
          ReceiptHandle: 'receipt-integration',
          MessageId: 'msg-integration',
        };

        await consumer.callProcessMessage(message);

        expect(consumer.handleMessageSpy).toHaveBeenCalledWith({
          id: 'integration-test',
          data: 'full-flow',
        });
      });

      it('should handle error with DLQ flow end-to-end', async () => {
        const consumer = createConsumer('TEST_QUEUE_URL');
        consumer.setDlqUrl(process.env.TEST_DLQ_URL!);
        consumer.handleMessageSpy.mockRejectedValueOnce(
          new Error('Integration error'),
        );
        sqsMock.on(SendMessageCommand).resolves({});

        const message: SQSRawMessage = {
          Body: JSON.stringify({ id: 'dlq-test', data: 'error-flow' }),
          ReceiptHandle: 'receipt-dlq',
          MessageId: 'msg-dlq',
        };

        await consumer.callProcessMessage(message);

        expect(consumer.handleMessageSpy).toHaveBeenCalled();
        expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
        expect(
          logger.logs.some((l) => l.message.includes('Message sent to DLQ')),
        ).toBe(true);
      });
    });

    describe('Consumer Lifecycle', () => {
      it('should handle full lifecycle: init -> start -> stop -> destroy', async () => {
        const consumer = createConsumer('TEST_QUEUE_URL');

        expect(consumer.getIsInitialized()).toBe(false);
        expect(consumer.getIsRunning()).toBe(false);

        await consumer.onModuleInit();

        expect(consumer.getIsInitialized()).toBe(true);
        expect(consumer.getIsRunning()).toBe(true);

        consumer.onModuleDestroy();

        expect(consumer.getIsInitialized()).toBe(true);
        expect(consumer.getIsRunning()).toBe(false);
      });
    });
  });
});
