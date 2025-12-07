import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePaymentUseCase } from '@payment/application/use-cases/create-payment/create-payment.use-case';
import { PaymentAlreadyExistsException } from '@payment/domain/exceptions/payment.exception';
import { PaymentRepository } from '@payment/domain/repositories/payment.repository';
import { IdempotencyKeyVO } from '@payment/domain/value-objects/idempotency-key.vo';
import { WorkflowExecutionAlreadyStartedError } from '@temporalio/client';
import type {
  ProcessPaymentInput,
  ProcessPaymentResult,
} from '../workflows/payment.workflow';
import {
  PAYMENT_TASK_QUEUE,
  TemporalClientService,
} from './temporal-client.service';

export type StartPaymentWorkflowInput = {
  sessionId: string;
  idempotencyKey: string;
  timeoutMinutes?: number;
};

export type StartPaymentWorkflowResult = {
  workflowId: string;
  runId: string;
  paymentId: string;
  qrCode: Buffer;
  alreadyRunning?: boolean;
};

export type SignalPaymentInput = {
  workflowId: string;
  status: 'confirmed' | 'failed';
  reason?: string;
};

@Injectable()
export class PaymentOrchestratorService {
  constructor(
    private readonly temporalClient: TemporalClientService,
    private readonly logger: AbstractLoggerService,
    @Inject(CreatePaymentUseCase)
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    @Inject(PaymentRepository)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  /**
   * Create a payment and start the payment processing workflow
   *
   * Flow:
   * 1. Create payment (calls Mercado Pago, gets QR Code)
   * 2. Start Temporal workflow to monitor payment status
   * 3. Return payment details including QR Code
   *
   * The workflowId uses idempotencyKey because that's what's returned
   * by the payment provider webhook as external_reference
   */
  async startPaymentWorkflow(
    input: StartPaymentWorkflowInput,
  ): Promise<StartPaymentWorkflowResult> {
    const workflowId = `payment-${input.idempotencyKey}`;
    const client = this.temporalClient.getClient();

    // Step 1: Create payment (this calls Mercado Pago and returns QR Code)
    this.logger.log('Creating payment before starting workflow', {
      sessionId: input.sessionId,
      idempotencyKey: input.idempotencyKey,
    });

    const createResult = await this.createPaymentUseCase.execute({
      sessionId: input.sessionId,
      idempotencyKey: input.idempotencyKey,
    });

    let paymentId: string;
    let qrCode: Buffer;

    if (createResult.isFailure) {
      // If payment already exists, try to get the existing payment and workflow
      if (createResult.error instanceof PaymentAlreadyExistsException) {
        this.logger.log('Payment already exists, checking workflow status', {
          idempotencyKey: input.idempotencyKey,
        });

        const existingPayment =
          await this.paymentRepository.findByIdempotencyKey(
            IdempotencyKeyVO.create(input.idempotencyKey),
          );

        if (!existingPayment) {
          throw createResult.error;
        }

        paymentId = existingPayment.id.value;
        qrCode = existingPayment.pixDetail?.qrCode
          ? Buffer.from(existingPayment.pixDetail.qrCode, 'base64')
          : Buffer.from('');

        // Check if workflow is already running
        try {
          const handle = client.workflow.getHandle(workflowId);
          const description = await handle.describe();

          this.logger.log('Returning existing payment and workflow', {
            paymentId,
            workflowId,
            workflowStatus: description.status.name,
          });

          return {
            workflowId,
            runId: description.runId,
            paymentId,
            qrCode,
            alreadyRunning: true,
          };
        } catch {
          // Workflow doesn't exist, will create it below
          this.logger.log(
            'Payment exists but workflow not found, starting new workflow',
            {
              paymentId,
              workflowId,
            },
          );
        }
      } else {
        this.logger.error('Failed to create payment', {
          error: createResult.error?.message,
          idempotencyKey: input.idempotencyKey,
        });
        throw createResult.error;
      }
    } else {
      paymentId = createResult.value.paymentId;
      qrCode = Buffer.from(createResult.value.image, 'base64');

      this.logger.log('Payment created, starting workflow', {
        paymentId,
        idempotencyKey: input.idempotencyKey,
      });
    }

    // Step 2: Start workflow to monitor payment
    try {
      const handle = await client.workflow.start('processPaymentWorkflow', {
        taskQueue: PAYMENT_TASK_QUEUE,
        workflowId,
        args: [
          {
            paymentId,
            sessionId: input.sessionId,
            idempotencyKey: input.idempotencyKey,
            timeoutMinutes: input.timeoutMinutes,
          } satisfies ProcessPaymentInput,
        ],
      });

      this.logger.log('Payment workflow started', {
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
        paymentId,
        idempotencyKey: input.idempotencyKey,
      });

      return {
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
        paymentId,
        qrCode,
      };
    } catch (error) {
      if (error instanceof WorkflowExecutionAlreadyStartedError) {
        this.logger.warn('Payment workflow already running', {
          workflowId,
          paymentId,
          idempotencyKey: input.idempotencyKey,
        });

        const handle = client.workflow.getHandle(workflowId);
        const description = await handle.describe();

        return {
          workflowId,
          runId: description.runId,
          paymentId,
          qrCode,
          alreadyRunning: true,
        };
      }
      throw error;
    }
  }

  /**
   * Signal a running payment workflow (e.g., from webhook)
   */
  async signalPayment(input: SignalPaymentInput): Promise<void> {
    const client = this.temporalClient.getClient();
    const handle = client.workflow.getHandle(input.workflowId);

    if (input.status === 'confirmed') {
      await handle.signal('paymentConfirmed', { status: 'confirmed' });
      this.logger.log('Payment confirmed signal sent', {
        workflowId: input.workflowId,
      });
    } else {
      await handle.signal('paymentFailed', {
        reason: input.reason || 'Unknown error',
      });
      this.logger.log('Payment failed signal sent', {
        workflowId: input.workflowId,
        reason: input.reason,
      });
    }
  }

  /**
   * Get payment workflow status
   */
  async getWorkflowStatus(
    workflowId: string,
  ): Promise<{ status: string; result?: ProcessPaymentResult }> {
    const client = this.temporalClient.getClient();
    const handle = client.workflow.getHandle(workflowId);

    const description = await handle.describe();

    if (description.status.name === 'COMPLETED') {
      const result = await handle.result();
      return { status: 'completed', result };
    }

    return { status: description.status.name.toLowerCase() };
  }
}
