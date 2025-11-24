import { Result } from "@core/domain/result";


export interface MarkAsPaidGateway<T extends object> {
    markAsPaid(paymentReference: string, body: T): Promise<Result<void>>;
}