import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Client, Connection } from '@temporalio/client';

export const PAYMENT_TASK_QUEUE = 'payment-tasks';

@Injectable()
export class TemporalClientService implements OnModuleInit, OnModuleDestroy {
  private connection: Connection | null = null;
  private client: Client | null = null;

  constructor(private readonly logger: AbstractLoggerService) {}

  async onModuleInit() {
    const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

    try {
      this.connection = await Connection.connect({
        address: temporalAddress,
      });

      this.client = new Client({
        connection: this.connection,
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      });

      this.logger.log('Temporal client connected', {
        address: temporalAddress,
      });
    } catch (error) {
      this.logger.error('Failed to connect to Temporal', {
        error: error instanceof Error ? error.message : 'Unknown error',
        address: temporalAddress,
      });
    }
  }

  async onModuleDestroy() {
    await this.connection?.close();
    this.logger.log('Temporal connection closed');
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error('Temporal client not initialized');
    }
    return this.client;
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}
