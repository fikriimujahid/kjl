export type PaymentStatus =
  | "CREATED"
  | "SUCCESS"
  | "PENDING"
  | "PENDING_REVIEW"
  | "FAILED"
  | "REFUNDED"
  | "UNKNOWN";

export interface PaymentOrderRecord {
  PK: string;
  SK: string;
  entityType: "PAYMENT_ORDER";
  orderId: string;
  userId: string;
  productId: string;
  name: string;
  level: string;
  amount: number;
  grossAmount: string;
  accessDurationDays: number;
  snapRedirectUrl: string | null;
  status: PaymentStatus;
  paymentProvider: "MIDTRANS";
  createdAt: string;
  updatedAt: string;
  accessGrantedAt?: string;
  expiryDate?: string;
  transactionStatus?: string;
  statusCode?: string;
  fraudStatus?: string | null;
  paymentType?: string | null;
  transactionId?: string | null;
  transactionTime?: string | null;
  settlementTime?: string | null;
}
