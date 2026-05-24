import { AuthenticatedUser } from "@shared-utils/auth";
import { ExternalServiceError } from "../errors/applicationErrors";
import { PaymentStatus } from "../models/payment";
import { listPaymentOrdersByUserId } from "../repositories/paymentOrderRepository";

export interface PaymentHistoryItem {
  orderId: string;
  productName: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface GetPaymentHistoryInput {
  authenticatedUser: AuthenticatedUser;
}

const sortByCreatedAtDesc = (left: PaymentHistoryItem, right: PaymentHistoryItem): number => {
  const leftTimestamp = Date.parse(left.createdAt);
  const rightTimestamp = Date.parse(right.createdAt);

  if (Number.isNaN(leftTimestamp) || Number.isNaN(rightTimestamp)) {
    return right.createdAt.localeCompare(left.createdAt);
  }

  return rightTimestamp - leftTimestamp;
};

export const getPaymentHistory = async (
  input: GetPaymentHistoryInput
): Promise<PaymentHistoryItem[]> => {
  let orders;

  try {
    orders = await listPaymentOrdersByUserId(input.authenticatedUser.id);
  } catch {
    throw new ExternalServiceError("Failed to load payment orders");
  }

  return orders
    .map((order) => ({
      orderId: order.orderId,
      productName: order.name,
      amount: order.amount,
      status: order.status,
      createdAt: order.createdAt
    }))
    .sort(sortByCreatedAtDesc);
};
