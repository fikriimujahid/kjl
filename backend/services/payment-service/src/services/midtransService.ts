import { createHash, timingSafeEqual } from "crypto";
import { createLogger } from "@shared-utils/logger";
import { PaymentStatus } from "../models/payment";

interface CreateSnapTransactionInput {
  serverKey: string;
  snapApiUrl: string;
  payload: Record<string, unknown>;
}

interface MidtransSnapResult {
  token: string;
  redirectUrl: string | null;
}

const logger = createLogger("payment-service");

const MAX_LOG_TEXT_LENGTH = 2000;

const safeEqualString = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const toMidtransAuthHeader = (serverKey: string): string => {
  const encodedCredential = Buffer.from(`${serverKey}:`).toString("base64");
  return `Basic ${encodedCredential}`;
};

const calculateMidtransSignature = (
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string
): string => {
  return createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
};

const readStringField = (payload: Record<string, unknown>, fieldName: string): string | null => {
  const value = payload[fieldName];
  return typeof value === "string" ? value : null;
};

const readSignatureComponent = (
  payload: Record<string, unknown>,
  fieldName: string
): string | null => {
  const value = payload[fieldName];

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const truncateText = (value: string): string => {
  if (value.length <= MAX_LOG_TEXT_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_LOG_TEXT_LENGTH)}...<truncated>`;
};

const tryParseJson = (value: string): unknown => {
  if (!value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return truncateText(value);
  }
};

export const createSnapTransaction = async (
  input: CreateSnapTransactionInput
): Promise<MidtransSnapResult> => {
  const transactionDetails =
    typeof input.payload.transaction_details === "object" && input.payload.transaction_details != null
      ? (input.payload.transaction_details as Record<string, unknown>)
      : null;

  logger.info("payment.midtrans.snap.request", {
    snapApiUrl: input.snapApiUrl,
    orderId: readStringField(transactionDetails ?? {}, "order_id")
  });

  const response = await fetch(input.snapApiUrl, {
    method: "POST",
    headers: {
      authorization: toMidtransAuthHeader(input.serverKey),
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify(input.payload)
  });

  const rawResponseBody = await response.text();
  const responseBody = tryParseJson(rawResponseBody);

  logger.info("payment.midtrans.snap.response", {
    status: response.status,
    statusText: response.statusText,
    responseType: Array.isArray(responseBody) ? "array" : typeof responseBody
  });

  if (!response.ok) {
    logger.warn("payment.midtrans.snap.rejected", {
      status: response.status,
      statusText: response.statusText
    });
    throw new Error(`Midtrans rejected payment creation with status ${response.status}`);
  }

  if (typeof responseBody !== "object" || responseBody == null || Array.isArray(responseBody)) {
    throw new Error("Midtrans Snap response payload is not a valid object");
  }

  const data = responseBody as Record<string, unknown>;
  const token = readStringField(data, "token");

  if (!token) {
    throw new Error("Midtrans Snap token was not returned");
  }

  return {
    token,
    redirectUrl: readStringField(data, "redirect_url")
  };
};

export const validateWebhookSignature = (
  payload: Record<string, unknown>,
  serverKey: string
): boolean => {
  const orderId = readStringField(payload, "order_id");
  const signatureKey = readStringField(payload, "signature_key");
  const statusCode = readSignatureComponent(payload, "status_code");
  const grossAmount = readSignatureComponent(payload, "gross_amount");

  if (!orderId || !signatureKey || !statusCode || !grossAmount) {
    return false;
  }

  const expectedSignature = calculateMidtransSignature(orderId, statusCode, grossAmount, serverKey);
  return safeEqualString(expectedSignature, signatureKey.trim().toLowerCase());
};

export const normalizePaymentStatus = (
  transactionStatus: string | null,
  fraudStatus: string | null
): PaymentStatus => {
  const normalizedTransactionStatus = transactionStatus?.toLowerCase() ?? "";
  const normalizedFraudStatus = fraudStatus?.toLowerCase() ?? null;

  if (normalizedTransactionStatus === "settlement") {
    return "SUCCESS";
  }

  if (normalizedTransactionStatus === "capture") {
    return normalizedFraudStatus === "accept" || !normalizedFraudStatus ? "SUCCESS" : "PENDING_REVIEW";
  }

  if (normalizedTransactionStatus === "pending" || normalizedTransactionStatus === "authorize") {
    return "PENDING";
  }

  if (["cancel", "deny", "expire", "failure"].includes(normalizedTransactionStatus)) {
    return "FAILED";
  }

  if (
    ["refund", "partial_refund", "chargeback", "partial_chargeback"].includes(
      normalizedTransactionStatus
    )
  ) {
    return "REFUNDED";
  }

  return "UNKNOWN";
};
