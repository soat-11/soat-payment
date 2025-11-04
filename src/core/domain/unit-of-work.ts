export interface UnitOfWork {
  start(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;

  payments: PaymentRepository;
  paymentDetails: PaymentDetailRepository;
}
