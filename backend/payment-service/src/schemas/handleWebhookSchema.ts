export const readOrderIdFromWebhookPayload = (payload: Record<string, unknown>): string | null => {
  const orderId = payload.order_id;

  if (typeof orderId !== "string" || orderId.length === 0) {
    return null;
  }

  return orderId;
};