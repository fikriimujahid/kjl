const PAYMENT_API_BASE_URL = (process.env.PAYMENT_API_BASE_URL ?? "").replace(/\/$/, ""); 

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
    throw new Error("Failed to create payment");
  }

  return response.json() as Promise<CreatePaymentResponse>;
}
