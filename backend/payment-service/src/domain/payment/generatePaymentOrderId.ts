import { randomUUID } from "crypto";

export const generatePaymentOrderId = (userId: string): string => {
  const orderIdTimestamp = Date.now().toString(36);
  const orderIdRandomChar = randomUUID().replace(/-/g, "").slice(0, 1);
  return `KJL~${userId}~${orderIdTimestamp}${orderIdRandomChar}`;
};