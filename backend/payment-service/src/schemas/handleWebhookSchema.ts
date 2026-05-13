import { z } from "zod";

const webhookOrderIdSchema = z.object({
  order_id: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().min(1, { message: "Missing order_id" })
  )
});

export const readOrderIdFromWebhookPayload = (payload: Record<string, unknown>): string | null => {
  const parsedPayload = webhookOrderIdSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return null;
  }

  return parsedPayload.data.order_id;
};