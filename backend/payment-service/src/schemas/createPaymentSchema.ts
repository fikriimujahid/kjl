import { z } from "zod";

const normalizePayloadObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
};

const productIdSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : ""),
  z.string().min(1, { message: "Missing productId" })
);

export const createPaymentSchema = z.preprocess(
  normalizePayloadObject,
  z.object({
    productId: productIdSchema
  })
);