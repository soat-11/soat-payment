import { DefaultEntity } from '@core/domain/default-entity';
import { DomainEvent } from '@core/events/domain-event';
import { DomainEventDispatcher } from '@core/events/domain-event-dispatcher';
import { DomainEventHandler } from '@core/events/domain-event-handler';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import SNS from 'aws-sdk/clients/sns';

export class AmazonSNSDomainEventDispatcher implements DomainEventDispatcher {
  constructor(
    private readonly sns: SNS = new SNS({
      apiVersion: '2012-11-05',
    }),
    private readonly logger: AbstractLoggerService,
  ) {
    this.logger.log('AmazonSNSDomainEventDispatcher initialized');
    this.sns.config.update({
      region: process.env.AWS_REGION,
    });
  }

  async dispatch<T extends DefaultEntity>(
    event: DomainEvent<T>,
  ): Promise<void> {
    try {
      await this.sns
        .publish({
          Message: JSON.stringify(event),
          TopicArn: process.env.AWS_SNS_TOPIC_ARN,
        })
        .promise();
    } catch (error) {
      this.logger.error('Error dispatching event to SNS', {
        error,
        event,
      });
    }
  }

  register<T extends DefaultEntity>(
    eventName: string,
    handler: DomainEventHandler<DomainEvent<T>>,
  ): void {
    // No-op: Local handlers are not supported in this implementation
  }

  getHandler<T extends DefaultEntity>(
    eventName: string,
  ): Array<(event: DomainEvent<T>) => void> {
    // No-op: Local handlers are not supported in this implementation
    return [];
  }
}
