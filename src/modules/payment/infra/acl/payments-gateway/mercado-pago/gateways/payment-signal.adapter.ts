import { Injectable } from '@nestjs/common';
import { PaymentOrchestratorService } from '@temporal/client/payment-orchestrator.service';
import { PaymentSignalService } from './mark-as-paid.gateway';

/**
 * Adapter that connects the payment domain to the Temporal workflow orchestrator.
 * Implements PaymentSignalService to send signals to running workflows.
 */
@Injectable()
export class PaymentSignalAdapter implements PaymentSignalService {
  constructor(private readonly orchestrator: PaymentOrchestratorService) {}

  async signalPaymentConfirmed(idempotencyKey: string): Promise<void> {
    const workflowId = `payment-${idempotencyKey}`;
    await this.orchestrator.signalPayment({
      workflowId,
      status: 'confirmed',
    });
  }

  async signalPaymentFailed(
    idempotencyKey: string,
    reason: string,
  ): Promise<void> {
    const workflowId = `payment-${idempotencyKey}`;
    await this.orchestrator.signalPayment({
      workflowId,
      status: 'failed',
      reason,
    });
  }
}

