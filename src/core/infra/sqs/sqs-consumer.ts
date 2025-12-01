import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export abstract class SqsConsumer implements OnModuleInit, OnModuleDestroy {
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

  private async poll() {
    if (!this.isPolling) return;

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        WaitTimeSeconds: 20,
      });

      const response = await this.sqs.send(command);

      if (response.Messages && response.Messages.length > 0) {
        await Promise.all(
          response.Messages.map((message) => this.processMessage(message)),
        );
      }
    } catch (error) {
      this.logger.error('Error polling SQS', { error });
    } finally {
      if (this.isPolling) {
        this.pollingInterval = setTimeout(() => this.poll(), 100);
      }
    }
  }

  private async processMessage(message: any) {
    try {
      if (!message.Body) return;

      const body = JSON.parse(message.Body);

      const content = body.Message ? JSON.parse(body.Message) : body;

      await this.handleMessage(content);

      const deleteCommand = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle!,
      });

      await this.sqs.send(deleteCommand);
    } catch (error) {
      this.logger.error('Error processing message', { error, message });
    }
  }

  abstract handleMessage(message: any): Promise<void>;
}
