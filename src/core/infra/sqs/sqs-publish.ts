import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';

import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';

export interface PublishMessage<T extends Record<string, unknown>> {
  publish(input: T): Promise<void>;
}

const SQS_MAX_MESSAGE_SIZE_BYTES = 262144; // 256KB

@Injectable()
export abstract class SqsPublish<T extends Record<string, unknown>>
  implements PublishMessage<T>
{
  private sqs: SQSClient;

  constructor(protected readonly logger: AbstractLoggerService) {
    this.sqs = new SQSClient({
      region: process.env.AWS_REGION,
      ...(process.env.AWS_ENDPOINT && { endpoint: process.env.AWS_ENDPOINT }),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    });

    this.logger.log('Starting SqsPublish', {
      resource: this.constructor.name,
    });
  }

  protected abstract get queueUrl(): string;

  private stringifyMessage(message: Record<string, unknown>): string {
    try {
      return JSON.stringify(message);
    } catch (error) {
      this.logger.error('Error stringifying message', {
        resource: this.constructor.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error('Failed to stringify message');
    }
  }

  async publish(input: T): Promise<void> {
    this.logger.log('Publishing message', {
      resource: this.constructor.name,
      queueUrl: this.queueUrl,
      input,
    });
    const message = this.stringifyMessage(input);
    const messageSizeBytes = Buffer.byteLength(message, 'utf-8');

    if (messageSizeBytes > SQS_MAX_MESSAGE_SIZE_BYTES) {
      this.logger.error('Message size exceeds SQS limit of 256KB', {
        resource: this.constructor.name,
        queueUrl: this.queueUrl,
        messageSizeBytes,
        maxSizeBytes: SQS_MAX_MESSAGE_SIZE_BYTES,
      });
      throw new Error(
        `Message size (${messageSizeBytes} bytes) exceeds SQS limit of ${SQS_MAX_MESSAGE_SIZE_BYTES} bytes (256KB)`,
      );
    }

    this.logger.log('Publishing message', {
      resource: this.constructor.name,
      queueUrl: this.queueUrl,
      messageSizeBytes,
    });

    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: message,
      });
      await this.sqs.send(command);
    } catch (error) {
      this.logger.error('Error publishing message', {
        resource: this.constructor.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error('Failed to publish message');
    }
  }
}
