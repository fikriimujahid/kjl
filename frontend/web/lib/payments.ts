const PAYMENT_API_BASE_URL = (process.env.PAYMENT_API_BASE_URL ?? "").replace(/\/$/, ""); 

interface ApiSuccessEnvelope<TData> {
  success: true;
  data: TData;
}

interface ApiErrorEnvelope {
  success?: false;
  error?: {
    message?: unknown;
  };
  message?: unknown;
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object";
};

const isCreatePaymentResponse = (value: unknown): value is CreatePaymentResponse => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.orderId === "string" &&
    typeof value.snapToken === "string" &&
    (typeof value.redirectUrl === "string" || value.redirectUrl === null)
  );
};

export class PaymentApiError extends Error {
  constructor(readonly statusCode: number, message: string) {
    super(message);
    this.name = "PaymentApiError";
  }
}

export interface CreatePaymentResponse {
  orderId: string;
  snapToken: string;
  redirectUrl: string | null;
}

interface CreatePaymentOptions {
  productId: string;
  idToken: string;
}

export async function createPayment({ productId, idToken }: CreatePaymentOptions): Promise<CreatePaymentResponse> {
  const response = await fetch(PAYMENT_API_BASE_URL+'/create', {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ productId }),
  });

  if (!response.ok) {
    let message = "Failed to create payment";
    try {
      const payload = (await response.json()) as ApiErrorEnvelope;
      const envelopeMessage = payload?.error?.message;

      if (typeof envelopeMessage === "string" && envelopeMessage.trim().length > 0) {
        message = envelopeMessage;
      } else if (typeof payload?.message === "string" && payload.message.trim().length > 0) {
        message = payload.message;
      }
    } catch {
      // keep default message
    }
    throw new PaymentApiError(response.status, message);
  }

  const payload = (await response.json()) as
    | ApiSuccessEnvelope<unknown>
    | CreatePaymentResponse
    | Record<string, unknown>;

  if (isObject(payload) && payload.success === true && "data" in payload) {
    const data = payload.data;

    if (isCreatePaymentResponse(data)) {
      return data;
    }

    throw new PaymentApiError(response.status, "Invalid create payment response payload");
  }

  if (isCreatePaymentResponse(payload)) {
    return payload;
  }

  throw new PaymentApiError(response.status, "Invalid create payment response payload");
}
