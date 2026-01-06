export type CreateOrderMessage = {
  sessionId: string;
  idempotencyKey: string;
};
