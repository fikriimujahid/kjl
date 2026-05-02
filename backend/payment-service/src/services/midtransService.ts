import { createHash, timingSafeEqual } from "crypto";
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

export const getMidtransSnapApiUrl = (isProduction: boolean, configuredUrl?: string): string => {
  if (configuredUrl && configuredUrl.trim()) {
    return configuredUrl.trim();
  }

  return isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";
};

export const createSnapTransaction = async (
  input: CreateSnapTransactionInput
): Promise<MidtransSnapResult> => {
  const response = await fetch(input.snapApiUrl, {
    method: "POST",
    headers: {
      authorization: toMidtransAuthHeader(input.serverKey),
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify(input.payload)
  });

  if (!response.ok) {
    throw new Error("Midtrans rejected payment creation");
  }

  const data = (await response.json()) as Record<string, unknown>;
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

  if (!orderId || !signatureKey) {
    return false;
  }

  const statusCodeValue = payload.status_code;
  const grossAmountValue = payload.gross_amount;
  const statusCode = statusCodeValue == null ? "" : String(statusCodeValue);
  const grossAmount = grossAmountValue == null ? "" : String(grossAmountValue);

  if (!statusCode || !grossAmount) {
    return false;
  }

  const expectedSignature = calculateMidtransSignature(orderId, statusCode, grossAmount, serverKey);
  return safeEqualString(expectedSignature, signatureKey);
};

export const normalizePaymentStatus = (
  transactionStatus: string | null,
  fraudStatus: string | null
): PaymentStatus => {
  if (transactionStatus === "settlement") {
    return "SUCCESS";
  }

  if (transactionStatus === "capture") {
    return fraudStatus === "accept" || !fraudStatus ? "SUCCESS" : "PENDING_REVIEW";
  }

  if (transactionStatus === "pending") {
    return "PENDING";
  }

  if (["cancel", "deny", "expire", "failure"].includes(transactionStatus ?? "")) {
    return "FAILED";
  }

  if (["refund", "partial_refund", "chargeback"].includes(transactionStatus ?? "")) {
    return "REFUNDED";
  }

  return "UNKNOWN";
};
