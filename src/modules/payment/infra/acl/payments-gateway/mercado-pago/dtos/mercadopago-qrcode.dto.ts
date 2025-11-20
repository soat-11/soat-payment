import { z } from 'zod';

export const CreateQRCodeMercadoPagoRequestSchema = z.object({
  type: z.literal('qr'),
  total_amount: z.string().regex(/^\d+\.\d{2}$/, {
    message:
      'O valor total deve estar no formato decimal com 2 casas (ex: 100.00)',
  }),
  expiration_time: z.string().regex(/^PT(\d+H)?(\d+M)?(\d+S)?$/, {
    message:
      'O tempo de expiração deve estar no formato ISO 8601 duration (ex: PT1H30M)',
  }),
  config: z.object({
    qr: z.object({
      external_pos_id: z.string().min(1, 'O ID do POS externo é obrigatório'),
      mode: z.literal('dynamic'),
    }),
  }),
  external_reference: z.string().min(1, 'A referência externa é obrigatória'),
  transactions: z.object({
    payments: z
      .array(
        z.object({
          amount: z.string().regex(/^\d+\.\d{2}$/, {
            message:
              'O valor do pagamento deve estar no formato decimal com 2 casas',
          }),
        }),
      )
      .min(1, 'Deve haver pelo menos um pagamento'),
  }),
  items: z
    .array(
      z.object({
        title: z.string().min(1, 'O título do item é obrigatório'),
        unit_price: z.string().regex(/^\d+\.\d{2}$/, {
          message: 'O preço unitário deve estar no formato decimal com 2 casas',
        }),
        quantity: z
          .number()
          .int()
          .positive('A quantidade deve ser um número positivo'),
        unit_measure: z.string().min(1, 'A unidade de medida é obrigatória'),
      }),
    )
    .min(1, 'Deve haver pelo menos um item'),
});

export const CreateQRCodeMercadoPagoResponseSchema = z.object({
  external_reference: z.string(),
  expiration_time: z.string(),
  type_response: z.object({
    qr_data: z.string().min(1, 'Os dados do QR Code não foi gerado'),
  }),
});

export type CreateQRCodeMercadoPagoRequest = z.infer<
  typeof CreateQRCodeMercadoPagoRequestSchema
>;

export type CreateQRCodeMercadoPagoResponse = z.infer<
  typeof CreateQRCodeMercadoPagoResponseSchema
>;
