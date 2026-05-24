import type { PaymentHistory } from "@/types";

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

type PaymentOrderStatus =
  | "CREATED"
  | "SUCCESS"
  | "PENDING"
  | "PENDING_REVIEW"
  | "FAILED"
  | "REFUNDED"
  | "UNKNOWN";

interface PaymentHistoryResponseItem {
  orderId: string;
  productName: string;
  amount: number;
  status: PaymentOrderStatus;
  createdAt: string;
}

interface FetchPaymentHistoryOptions {
  idToken: string;
  signal?: AbortSignal;
}

const isPaymentOrderStatus = (value: unknown): value is PaymentOrderStatus => {
  return (
    value === "CREATED" ||
    value === "SUCCESS" ||
    value === "PENDING" ||
    value === "PENDING_REVIEW" ||
    value === "FAILED" ||
    value === "REFUNDED" ||
    value === "UNKNOWN"
  );
};

const isPaymentHistoryResponseItem = (value: unknown): value is PaymentHistoryResponseItem => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.orderId === "string" &&
    typeof value.productName === "string" &&
    typeof value.amount === "number" &&
    isPaymentOrderStatus(value.status) &&
    typeof value.createdAt === "string"
  );
};

const readApiErrorMessage = async (response: Response, fallbackMessage: string): Promise<string> => {
  let message = fallbackMessage;

  try {
    const payload = (await response.json()) as ApiErrorEnvelope;
    const envelopeMessage = payload?.error?.message;

    if (typeof envelopeMessage === "string" && envelopeMessage.trim().length > 0) {
      message = envelopeMessage;
    } else if (typeof payload?.message === "string" && payload.message.trim().length > 0) {
      message = payload.message;
    }
  } catch {
    // Keep default message when response body cannot be parsed.
  }

  return message;
};

const toPaymentHistoryStatus = (
  status: PaymentOrderStatus
): PaymentHistory["status"] => {
  if (status === "SUCCESS") {
    return "Success";
  }

  if (status === "FAILED" || status === "REFUNDED") {
    return "Failed";
  }

  return "Pending";
};

const normalizePaymentDate = (value: string): string => {
  return value.length >= 10 ? value.slice(0, 10) : value;
};

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
    const message = await readApiErrorMessage(response, "Failed to create payment");
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

export async function fetchPaymentHistory({
  idToken,
  signal
}: FetchPaymentHistoryOptions): Promise<PaymentHistory[]> {
  const response = await fetch(`${PAYMENT_API_BASE_URL}/history`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${idToken}`
    },
    signal,
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await readApiErrorMessage(response, "Failed to load payment history");
    throw new PaymentApiError(response.status, message);
  }

  const payload = (await response.json()) as
    | ApiSuccessEnvelope<unknown>
    | PaymentHistoryResponseItem[]
    | Record<string, unknown>;

  const data = isObject(payload) && payload.success === true && "data" in payload
    ? payload.data
    : payload;

  if (!Array.isArray(data) || !data.every(isPaymentHistoryResponseItem)) {
    throw new PaymentApiError(response.status, "Invalid payment history response payload");
  }

  return data.map((item) => ({
    id: item.orderId,
    productName: item.productName,
    date: normalizePaymentDate(item.createdAt),
    amount: item.amount,
    status: toPaymentHistoryStatus(item.status)
  }));
}
