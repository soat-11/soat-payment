import { DefaultHttpClientResponse, PostMethod } from "@core/infra/http/client/http-client"
import { PinoLoggerService } from "@core/infra/logger/pino-logger"
import { PaymentType } from "@payment/domain/enum/payment-type.enum"
import { CreatePixPaymentGatewayImpl } from "@payment/infra/acl/payments-gateway/mercado-pago/gateways/create-pix-payment.gateway"
import { CreateQRCodeMercadoPagoResponse } from "@payment/infra/acl/payments-gateway/mercado-pago/dtos"

describe('CreatePixPaymentGateway', () => {
    beforeAll(() => {
        process.env.MERCADO_PAGO_POS_ID = '123'
    })

    it('should create a payment', async () => {
        const response: DefaultHttpClientResponse<CreateQRCodeMercadoPagoResponse> = {
            status: 200,
            data: {
                expiration_time: '2025-11-20T16:04:55-03:00',
                external_reference: '123',
                message: '123',
                type_response: {
                    qr_data: '123',
                },
            },
            headers: {}

        }
        const client: PostMethod = {
            post: jest.fn().mockResolvedValue(response),
        }
        const createPixPaymentGateway = new CreatePixPaymentGatewayImpl(
            client,
            new PinoLoggerService()
        )

        const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

        const result = await createPixPaymentGateway.createPayment({
            amount: 10,
            expirationTime: tenMinutesFromNow,
            externalReference: '123',
            idempotencyKey: '123',
            items: [
                {
                    title: 'Item 1',
                    unitPrice: 10,
                    quantity: 1,
                },
            ],
            type: PaymentType.PIX,
            })

            expect(result.value.qrCode).toBeDefined()
            expect(typeof result.value.qrCode).toBe('string')
    })
})