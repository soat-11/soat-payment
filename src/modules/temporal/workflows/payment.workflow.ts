import {
  ApplicationFailure,
  condition,
  defineSignal,
  proxyActivities,
  setHandler,
} from '@temporalio/workflow';
import type { PaymentActivitiesService } from '../activities/payment-activities.service';

// Inputs e Outputs do workflow
export type ProcessPaymentInput = {
  paymentId: string;
  sessionId: string;
  idempotencyKey: string;
  timeoutMinutes?: number;
};

export type ProcessPaymentResult = {
  status: 'paid' | 'cancelled' | 'expired';
  paymentId: string;
  reason?: string;
};

// Signals que o workflow pode receber (do webhook)
export const paymentConfirmedSignal =
  defineSignal<[{ status: 'confirmed' }]>('paymentConfirmed');
export const paymentFailedSignal =
  defineSignal<[{ reason: string }]>('paymentFailed');

// Proxy das activities
const { markPaymentAsPaid, cancelPayment, notifyPaymentCompleted } =
  proxyActivities<PaymentActivitiesService>({
    retry: {
      initialInterval: '1 second',
      maximumInterval: '1 minute',
      maximumAttempts: 3,
    },
    startToCloseTimeout: '1 minute',
  });

/**
 * Payment Processing Workflow
 *
 * This workflow manages the payment lifecycle after the payment has been created.
 * It waits for a webhook signal from the payment provider (e.g., Mercado Pago)
 * and then marks the payment as paid or handles timeout/failure.
 *
 * Flow:
 * 1. Payment is created via API (returns QR Code to checkout)
 * 2. API starts this workflow with the paymentId
 * 3. Workflow waits for webhook signal (with timeout)
 * 4. On confirmation: marks payment as paid
 * 5. On timeout/failure: cancels payment
 */
export async function processPaymentWorkflow(
  input: ProcessPaymentInput,
): Promise<ProcessPaymentResult> {
  const { paymentId, sessionId, timeoutMinutes = 30 } = input;

  // Estado do workflow (sinais atualizam isso)
  let webhookReceived = false;
  let webhookStatus: 'confirmed' | 'failed' | null = null;
  let failureReason: string | null = null;

  // Configura handlers dos signals
  setHandler(paymentConfirmedSignal, () => {
    webhookReceived = true;
    webhookStatus = 'confirmed';
  });

  setHandler(paymentFailedSignal, ({ reason }) => {
    webhookReceived = true;
    webhookStatus = 'failed';
    failureReason = reason;
  });

  // ===== STEP 1: Aguardar webhook (com timeout) =====
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const receivedInTime = await condition(() => webhookReceived, timeoutMs);

  // ===== STEP 2: Processar resultado =====

  // Timeout - expirou
  if (!receivedInTime) {
    try {
      await cancelPayment({
        paymentId,
        reason: 'Payment expired - no webhook received',
      });
    } catch {
      // Ignorar erro de cancelamento
    }
    return {
      status: 'expired',
      paymentId,
      reason: 'Payment expired waiting for confirmation',
    };
  }

  // Webhook recebido mas falhou
  if (webhookStatus === 'failed') {
    try {
      await cancelPayment({
        paymentId,
        reason: failureReason || 'Payment failed',
      });
    } catch {
      // Ignorar erro de cancelamento
    }
    return {
      status: 'cancelled',
      paymentId,
      reason: failureReason || 'Payment failed',
    };
  }

  // ===== STEP 3: Webhook confirmado - marcar como pago =====
  try {
    await markPaymentAsPaid({ paymentId });
  } catch (error) {
    throw ApplicationFailure.nonRetryable(
      `Failed to mark payment as paid: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'MARK_PAID_FAILED',
    );
  }

  // ===== STEP 4: Notificar sistemas downstream =====
  await notifyPaymentCompleted({ paymentId, sessionId });

  return {
    status: 'paid',
    paymentId,
  };
}
