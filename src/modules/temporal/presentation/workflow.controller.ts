import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentOrchestratorService } from '../client/payment-orchestrator.service';
import { TemporalClientService } from '../client/temporal-client.service';
import { SignalPaymentDto, StartPaymentWorkflowDto } from './dto/start-workflow.dto';

@ApiTags('Payments')
@Controller('payments')
export class WorkflowController {
  constructor(
    private readonly orchestrator: PaymentOrchestratorService,
    private readonly temporalClient: TemporalClientService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar Pagamento',
    description: `
## Descrição
Cria um novo pagamento PIX e inicia o workflow de acompanhamento.

## Fluxo
1. **Cria pagamento** no Mercado Pago (retorna QR Code)
2. **Inicia workflow Temporal** para monitorar o pagamento
3. **Retorna QR Code** para exibir ao cliente

## Workflow de Acompanhamento
- Aguarda confirmação via webhook (Mercado Pago)
- Timeout configurável (padrão: 30 minutos)
- Se confirmado: marca pagamento como pago
- Se timeout: cancela o pagamento

## Como Usar

### 1. Crie o pagamento
\`\`\`bash
curl -X POST http://localhost:3010/payments \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "session-123",
    "idempotencyKey": "idem-abc-123",
    "timeoutMinutes": 5
  }'
\`\`\`

### 2. Exiba o QR Code para o cliente
A resposta contém o \`qrCode\` em base64.

### 3. Aguarde o webhook do Mercado Pago
O Mercado Pago enviará uma notificação quando o pagamento for confirmado:
\`\`\`
POST /webhooks/mercado-pago/{idempotencyKey}
\`\`\`

### 4. Consulte o status
\`\`\`bash
curl http://localhost:3010/payments/payment-idem-abc-123/status
\`\`\`

## Observações
- O \`idempotencyKey\` deve ser único por pagamento
- O \`idempotencyKey\` é usado como \`external_reference\` no Mercado Pago
- O workflow ID é gerado como \`payment-{idempotencyKey}\`
    `,
  })
  @ApiBody({ type: StartPaymentWorkflowDto })
  @ApiResponse({
    status: 201,
    description: 'Pagamento criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', example: 'uuid-do-pagamento' },
        workflowId: { type: 'string', example: 'payment-idem-abc-123' },
        qrCode: { type: 'string', description: 'QR Code em base64' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Temporal não está disponível',
  })
  async createPayment(@Body() dto: StartPaymentWorkflowDto) {
    if (!this.temporalClient.isConnected()) {
      return {
        error: 'Temporal service not available',
        message: 'Please ensure Temporal server is running',
      };
    }

    const result = await this.orchestrator.startPaymentWorkflow({
      sessionId: dto.sessionId,
      idempotencyKey: dto.idempotencyKey,
      timeoutMinutes: dto.timeoutMinutes,
    });

    return {
      paymentId: result.paymentId,
      workflowId: result.workflowId,
      qrCode: result.qrCode.toString('base64'),
      alreadyRunning: result.alreadyRunning,
      message: result.alreadyRunning
        ? 'Payment already exists, returning existing payment'
        : 'Payment created successfully',
    };
  }

  @Post(':workflowId/signal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar Signal para Workflow (uso interno)',
    description: `
## Descrição
Envia um signal para um workflow em execução.

**Nota**: Este endpoint é para uso interno/debug.
O webhook do Mercado Pago usa \`/webhooks/mercado-pago/{idempotencyKey}\`.
    `,
  })
  @ApiParam({
    name: 'workflowId',
    description: 'ID do workflow (formato: payment-{idempotencyKey})',
    example: 'payment-idem-abc-123',
  })
  @ApiBody({ type: SignalPaymentDto })
  @ApiResponse({
    status: 200,
    description: 'Signal enviado com sucesso',
  })
  async signalPayment(
    @Param('workflowId') workflowId: string,
    @Body() dto: SignalPaymentDto,
  ) {
    await this.orchestrator.signalPayment({
      workflowId,
      status: dto.status,
      reason: dto.reason,
    });

    return {
      message: `Signal '${dto.status}' sent to workflow ${workflowId}`,
    };
  }

  @Get(':workflowId/status')
  @ApiOperation({
    summary: 'Consultar Status do Pagamento',
    description: `
## Descrição
Retorna o status atual de um pagamento/workflow.

## Estados possíveis
- \`running\`: Aguardando confirmação do pagamento
- \`completed\`: Pagamento finalizado (pago, cancelado ou expirado)
- \`failed\`: Erro no processamento
    `,
  })
  @ApiParam({
    name: 'workflowId',
    description: 'ID do workflow',
    example: 'payment-idem-abc-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do pagamento',
    schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string' },
        status: { type: 'string' },
        result: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['paid', 'cancelled', 'expired'] },
            paymentId: { type: 'string' },
            reason: { type: 'string' },
          },
        },
      },
    },
  })
  async getPaymentStatus(@Param('workflowId') workflowId: string) {
    const result = await this.orchestrator.getWorkflowStatus(workflowId);

    return {
      workflowId,
      ...result,
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Verifica se os serviços estão disponíveis',
  })
  @ApiResponse({
    status: 200,
    description: 'Status dos serviços',
  })
  getHealth() {
    return {
      temporal: {
        connected: this.temporalClient.isConnected(),
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      },
    };
  }
}
