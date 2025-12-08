import {
  DeleteMessageCommand,
  Message,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer } from 'sqs-consumer';

export type SQSRawMessage = {
  Body: string;
  ReceiptHandle: string;
  MessageId?: string;
};

export type SqsConsumerOptions = {
  batchSize?: number;
  waitTimeSeconds?: number;
  visibilityTimeout?: number;
};

const DEFAULT_CONSUMER_OPTIONS: Required<SqsConsumerOptions> = {
  batchSize: 1,
  waitTimeSeconds: 20,
  visibilityTimeout: 60,
};

export type DlqMessageContext<T> = {
  originalMessage: T;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  queueUrl: string;
  timestamp: string;
  consumerName: string;
  retryCount?: number;
};

@Injectable()
export abstract class SqsConsumer<TPayload = unknown>
  implements OnModuleInit, OnModuleDestroy
{
  private client: SQSClient;
  private consumer: Consumer | null = null;
  private _isRunning = false;
  private readonly queueUrl: string;
  private readonly options: Required<SqsConsumerOptions>;

  protected get dlqUrl(): string | null {
    return null;
  }

  constructor(
    protected readonly logger: AbstractLoggerService,
    queueUrlEnvVar: string,
    options: SqsConsumerOptions = {},
  ) {
    this.client = new SQSClient({
      region: process.env.AWS_REGION,
      ...(process.env.AWS_ENDPOINT && { endpoint: process.env.AWS_ENDPOINT }),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    });

    this.queueUrl = process.env[queueUrlEnvVar] || '';
    this.options = { ...DEFAULT_CONSUMER_OPTIONS, ...options };

    if (!this.queueUrl) {
      this.logger.warn(
        `Queue URL not found in environment variable: ${queueUrlEnvVar}`,
      );
    }
  }

  async onModuleInit() {
    if (this.queueUrl) {
      this.start();
    }
  }

  onModuleDestroy() {
    this.stop();
  }

  private initialize(): boolean {
    if (this.consumer) {
      return true;
    }

    if (!this.queueUrl) {
      this.logger.warn(
        `Queue URL not configured for consumer: ${this.constructor.name}`,
      );
      return false;
    }

    try {
      this.consumer = Consumer.create({
        queueUrl: this.queueUrl,
        handleMessage: async (
          message: Message,
        ): Promise<Message | undefined> => {
          this.logger.log('sqs-consumer: starting message handling', {
            resource: this.constructor.name,
            messageId: message.MessageId,
          });
          await this.processMessage(message);
          this.logger.log(
            'sqs-consumer: processMessage completed, returning undefined to trigger deletion',
            {
              resource: this.constructor.name,
              messageId: message.MessageId,
            },
          );
          return undefined;
        },
        sqs: this.client,
        batchSize: this.options.batchSize,
        waitTimeSeconds: this.options.waitTimeSeconds,
        visibilityTimeout: this.options.visibilityTimeout,
      });

      this.setupEventHandlers();

      this.logger.log(`Consumer initialized for queue: ${this.queueUrl}`, {
        resource: this.constructor.name,
        options: this.options,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to initialize consumer', {
        resource: this.constructor.name,
        error,
        stack: error instanceof Error ? error.stack : undefined,
        queueUrl: this.queueUrl,
      });
      return false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.consumer) return;

    this.consumer.on('started', () => {
      this.logger.log('Consumer started', {
        resource: this.constructor.name,
        queueUrl: this.queueUrl,
      });
    });

    this.consumer.on('stopped', () => {
      this.logger.log('Consumer stopped', {
        resource: this.constructor.name,
        queueUrl: this.queueUrl,
      });
    });

    this.consumer.on('error', (error) => {
      this.logger.error('Consumer error', {
        resource: this.constructor.name,
        error: error.message,
        stack: error.stack,
        queueUrl: this.queueUrl,
      });
    });

    this.consumer.on('processing_error', (error, message) => {
      this.logger.error('Processing error', {
        resource: this.constructor.name,
        error: error.message,
        stack: error.stack,
        messageId: message?.MessageId,
        queueUrl: this.queueUrl,
      });
    });

    this.consumer.on('timeout_error', (error, message) => {
      this.logger.error('Timeout error', {
        resource: this.constructor.name,
        error: error.message,
        stack: error.stack,
        messageId: message?.MessageId,
        queueUrl: this.queueUrl,
      });
    });

    this.consumer.on('message_received', (message) => {
      this.logger.log('Message received', {
        resource: this.constructor.name,
        messageId: message.MessageId,
      });
    });

    this.consumer.on('message_processed', (message) => {
      this.logger.log('Message processed and DELETED from queue', {
        resource: this.constructor.name,
        messageId: message.MessageId,
        receiptHandle: message.ReceiptHandle?.substring(0, 50),
      });
    });

    this.consumer.on('response_processed' as never, () => {
      this.logger.log('Delete response received from SQS', {
        resource: this.constructor.name,
      });
    });

    this.consumer.on('empty', () => {
      this.logger.debug?.('Queue is empty', {
        resource: this.constructor.name,
        queueUrl: this.queueUrl,
      });
    });
  }

  protected start(): void {
    if (this._isRunning) {
      this.logger.warn('Consumer is already running', {
        resource: this.constructor.name,
      });
      return;
    }

    if (!this.consumer && !this.initialize()) {
      this.logger.error('Cannot start consumer - initialization failed', {
        resource: this.constructor.name,
      });
      return;
    }

    if (!this.consumer) {
      this.logger.error('Cannot start consumer - consumer is null', {
        resource: this.constructor.name,
      });
      return;
    }

    this._isRunning = true;
    this.consumer.start();
  }

  protected stop(): void {
    if (!this.consumer) {
      return;
    }

    if (!this._isRunning) {
      this.logger.warn('Consumer is not running', {
        resource: this.constructor.name,
      });
      return;
    }

    this._isRunning = false;
    this.consumer.stop();
  }

  protected get isRunning(): boolean {
    return this._isRunning;
  }

  protected get isInitialized(): boolean {
    return !!this.consumer;
  }

  private isValidMessage(message: unknown): message is SQSRawMessage {
    if (!message || typeof message !== 'object') {
      return false;
    }
    const msg = message as Partial<SQSRawMessage>;
    return (
      typeof msg.Body === 'string' && typeof msg.ReceiptHandle === 'string'
    );
  }

  private parseMessagePayload(message: SQSRawMessage): TPayload | null {
    try {
      return JSON.parse(message.Body) as TPayload;
    } catch (error) {
      this.logger.error('Error parsing message payload', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: message.Body,
        resource: this.constructor.name,
      });
      return null;
    }
  }

  protected async deleteMessage(receiptHandle: string) {
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });
    await this.client.send(command);
  }

  private async processMessage(message: Message): Promise<void> {
    if (!this.isValidMessage(message)) {
      this.logger.error('Invalid message format', {
        resource: this.constructor.name,
        messageId: message.MessageId,
        hasBody: !!message.Body,
        hasReceiptHandle: !!message.ReceiptHandle,
      });
      throw new Error('Invalid message format');
    }

    const payload = this.parseMessagePayload(message);

    if (payload === null) {
      this.logger.error(
        'Failed to parse message payload - discarding message',
        {
          resource: this.constructor.name,
          messageId: message.MessageId,
        },
      );
      return;
    }

    try {
      await this.handleMessage(payload);
      this.logger.log('handleMessage completed successfully', {
        resource: this.constructor.name,
        messageId: message.MessageId,
      });

      await this.deleteMessage(message.ReceiptHandle);
    } catch (error) {
      this.logger.error('Error in handleMessage', {
        resource: this.constructor.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        messageId: message.MessageId,
      });

      if (this.dlqUrl && error instanceof Error) {
        const sentToDlq = await this.sendToDlq(payload, error);
        if (sentToDlq) {
          return;
        }
      }

      throw error;
    }
  }

  abstract handleMessage(payload: TPayload): Promise<void>;

  protected async sendToDlq(message: TPayload, error: Error): Promise<boolean> {
    if (!this.dlqUrl) {
      this.logger.warn('DLQ URL not configured, message will not be sent', {
        resource: this.constructor.name,
      });
      return false;
    }

    const dlqMessage: DlqMessageContext<TPayload> = {
      originalMessage: message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      queueUrl: this.queueUrl,
      timestamp: new Date().toISOString(),
      consumerName: this.constructor.name,
    };

    try {
      const command = new SendMessageCommand({
        QueueUrl: this.dlqUrl,
        MessageBody: JSON.stringify(dlqMessage),
      });
      await this.client.send(command);

      this.logger.log('Message sent to DLQ', {
        resource: this.constructor.name,
        dlqUrl: this.dlqUrl,
        errorMessage: error.message,
      });

      return true;
    } catch (dlqError) {
      this.logger.error('Failed to send message to DLQ', {
        resource: this.constructor.name,
        error: dlqError instanceof Error ? dlqError.message : 'Unknown error',
        stack: dlqError instanceof Error ? dlqError.stack : undefined,
        dlqUrl: this.dlqUrl,
      });
      return false;
    }
  }

  protected getQueueUrl(): string {
    return this.queueUrl;
  }

  protected getClient(): SQSClient {
    return this.client;
  }
}
