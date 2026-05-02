const PAYMENT_API_BASE_URL = (process.env.NEXT_PUBLIC_PAYMENT_API_BASE_URL ?? "").replace(/\/$/, "");

export interface CreatePaymentResponse {
  orderId: string;
  snapToken: string;
  redirectUrl: string | null;
}

interface CreatePaymentOptions {
  productId: string;
  idToken: string;
}

const resolveCreatePaymentUrl = (): string => {
  if (!PAYMENT_API_BASE_URL) {
    return "/api/payments/create";
  }

  return `${PAYMENT_API_BASE_URL}/api/payments/create`;
};

export async function createPayment({ productId, idToken }: CreatePaymentOptions): Promise<CreatePaymentResponse> {
  const response = await fetch(resolveCreatePaymentUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ productId }),
  });

  if (!response.ok) {
    throw new Error("Failed to create payment");
  }

  return response.json() as Promise<CreatePaymentResponse>;
}
