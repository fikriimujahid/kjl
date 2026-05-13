const PAYMENT_API_BASE_URL = (process.env.PAYMENT_API_BASE_URL ?? "").replace(/\/$/, ""); 

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
      const body = await response.json() as { message?: string };
      if (typeof body.message === "string") {
        message = body.message;
      }
    } catch {
      // keep default message
    }
    throw new PaymentApiError(response.status, message);
  }

  return response.json() as Promise<CreatePaymentResponse>;
}
