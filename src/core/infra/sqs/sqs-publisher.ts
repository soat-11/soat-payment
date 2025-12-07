import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { Injectable } from '@nestjs/common';

export type PublishMessageOptions = {
  delaySeconds?: number;
  messageGroupId?: string;
  messageDeduplicationId?: string;
};

@Injectable()
export class SqsPublisher {
  private readonly client: SQSClient;

  constructor(protected readonly logger: AbstractLoggerService) {
    this.client = new SQSClient({
      region: process.env.AWS_REGION,
      ...(process.env.AWS_ENDPOINT && { endpoint: process.env.AWS_ENDPOINT }),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    });
  }

  async publish<T>(
    queueUrl: string,
    message: T,
    options: PublishMessageOptions = {},
  ): Promise<string | undefined> {
    const messageBody = JSON.stringify(message);

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      ...(options.delaySeconds && { DelaySeconds: options.delaySeconds }),
      ...(options.messageGroupId && { MessageGroupId: options.messageGroupId }),
      ...(options.messageDeduplicationId && {
        MessageDeduplicationId: options.messageDeduplicationId,
      }),
    });

    try {
      const result = await this.client.send(command);

      this.logger.log('Message published to SQS', {
        queueUrl,
        messageId: result.MessageId,
      });

      return result.MessageId;
    } catch (error) {
      this.logger.error('Failed to publish message to SQS', {
        queueUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async publishToCancelPayment<T>(message: T): Promise<string | undefined> {
    const queueUrl = process.env.AWS_SQS_CANCEL_PAYMENT_QUEUE_URL;
    if (!queueUrl) {
      throw new Error('AWS_SQS_CANCEL_PAYMENT_QUEUE_URL not configured');
    }
    return this.publish(queueUrl, message);
  }
}

