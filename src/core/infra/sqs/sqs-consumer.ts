import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

export type SQSRawMessage = {
  Body: string;
  ReceiptHandle: string;
};

@Injectable()
export abstract class SqsConsumer<TPayload = unknown>
  implements OnModuleInit, OnModuleDestroy
{
  private sqs: SQSClient;
  private queueUrl: string;
  private isPolling = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(
    protected readonly logger: AbstractLoggerService,
    queueUrlEnvVar: string,
  ) {
    this.sqs = new SQSClient({
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    });
    this.queueUrl = process.env[queueUrlEnvVar] || '';

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

  start() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.logger.log(`Starting SQS consumer for queue: ${this.queueUrl}`);
    this.poll();
  }

  stop() {
    this.isPolling = false;
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
    }
    this.logger.log('Stopping SQS consumer');
  }

  private isValidMessage(message: unknown): message is SQSRawMessage {
    const msg = message as Partial<SQSRawMessage>;
    return !!msg.Body && !!msg.ReceiptHandle;
  }

  private async poll() {
    if (!this.isPolling) return;

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        WaitTimeSeconds: 20,
      });

      const response = await this.sqs.send(command);

      const messages = response.Messages;
      if (!messages?.length) return;

      const validMessages = messages.filter(this.isValidMessage);
      await Promise.all(validMessages.map((msg) => this.processMessage(msg)));
    } catch (error) {
      this.logger.error('Error polling SQS', {
        error,
        queueUrl: this.queueUrl,
      });
    } finally {
      if (this.isPolling) {
        this.pollingInterval = setTimeout(() => this.poll(), 5000);
      }
    }
  }

  private async processMessage(message: SQSRawMessage) {
    try {
      this.logger.log('Processing message', { message });
      if (!message.Body) return;

      const payload = this.parseMessagePayload(message);
      if (!payload) {
        this.logger.error('Error parsing message payload', { message });
        return;
      }

      this.logger.log('Message payload', { payload });
      await this.handleMessage(payload);

      this.logger.log('Message processed', { payload });

      const deleteCommand = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle!,
      });

      this.logger.log('Deleting message', { deleteCommand });

      await this.sqs.send(deleteCommand);
      this.logger.log('Message deleted', { deleteCommand });
    } catch (error) {
      this.logger.error('Error processing message', { error, message });
    }
  }

  abstract handleMessage(payload: TPayload): Promise<void>;

  private parseMessagePayload(message: SQSRawMessage): TPayload | null {
    try {
      this.logger.log('Parsing message payload', { body: message.Body });
      const body = JSON.parse(message.Body) as { Message: string };
      this.logger.log('Parsed SNS wrapper', { body });
      const payload = JSON.parse(body.Message) as TPayload;
      this.logger.log('Parsed payload', { payload });
      return payload;
    } catch (error) {
      this.logger.error('Error parsing message payload', { error, message });
      return null;
    }
  }
}
