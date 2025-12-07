import { Module } from '@nestjs/common';
import { PaymentApplicationModule } from '@payment/application/application.module';
import { PaymentInfraModule } from '@payment/infra/infra.module';
import { PaymentActivitiesService } from './activities/payment-activities.service';
import { PaymentOrchestratorService } from './client/payment-orchestrator.service';
import { TemporalClientService } from './client/temporal-client.service';
import { WorkflowController } from './presentation/workflow.controller';

@Module({
  imports: [PaymentApplicationModule, PaymentInfraModule],
  controllers: [WorkflowController],
  providers: [
    TemporalClientService,
    PaymentOrchestratorService,
    PaymentActivitiesService,
  ],
  exports: [
    TemporalClientService,
    PaymentOrchestratorService,
    PaymentActivitiesService,
  ],
})
export class TemporalModule {}
