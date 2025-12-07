import { NestFactory } from '@nestjs/core';
import { NativeConnection, Worker } from '@temporalio/worker';
import { AppModule } from '../../../app.module';
import { PaymentActivitiesService } from '../activities/payment-activities.service';

const TASK_QUEUE = 'payment-tasks';

async function run() {
  // Bootstrap NestJS application to get DI container
  const app = await NestFactory.createApplicationContext(AppModule);
  const activitiesService = app.get(PaymentActivitiesService);

  // Create activities object with methods bound to the service instance
  const activities = {
    markPaymentAsPaid:
      activitiesService.markPaymentAsPaid.bind(activitiesService),
    cancelPayment: activitiesService.cancelPayment.bind(activitiesService),
    notifyPaymentCompleted:
      activitiesService.notifyPaymentCompleted.bind(activitiesService),
  };

  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

  console.log(`[Worker] Connecting to Temporal at ${temporalAddress}...`);

  const connection = await NativeConnection.connect({
    address: temporalAddress,
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: TASK_QUEUE,
    workflowsPath: require.resolve('../workflows/payment.workflow'),
    activities,
  });

  console.log(`[Worker] Started on task queue: ${TASK_QUEUE}`);
  console.log('[Worker] Environment:');
  console.log(`  - AWS_REGION: ${process.env.AWS_REGION}`);
  console.log(`  - AWS_ENDPOINT: ${process.env.AWS_ENDPOINT}`);
  console.log(
    `  - CANCEL_PAYMENT_QUEUE: ${process.env.AWS_SQS_CANCEL_PAYMENT_QUEUE_URL}`,
  );

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[Worker] Shutting down...');
    await worker.shutdown();
    await connection.close();
    await app.close();
    console.log('[Worker] Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await worker.run();
}

run().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
