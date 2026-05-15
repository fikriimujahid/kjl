interface CreatePaymentPayload {
  productId: string;
}

interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

interface SafeParseFailure {
  success: false;
  error: string;
}

type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

const readProductId = (payload: Record<string, unknown>): string | null => {
  const value = payload.productId;
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  return normalizedValue.length > 0 ? normalizedValue : null;
};

const normalizePayloadObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
};

export const createPaymentSchema = {
  safeParse: (input: unknown): SafeParseResult<CreatePaymentPayload> => {
    const payload = normalizePayloadObject(input);
    const productId = readProductId(payload);

    if (!productId) {
      return {
        success: false,
        error: "productId is required"
      };
    }

    return {
      success: true,
      data: {
        productId
      }
    };
  }
};