import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { PaymentOrderRecord } from "../models/payment";
import { parseEventBody } from "../utils/request";
import { jsonResponse } from "../utils/response";
import { normalizePaymentStatus, validateWebhookSignature } from "../services/midtransService";
import { grantProductAccess, readPaymentOrder, savePaymentOrder } from "../services/paymentRepository";

const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

const readStringField = (payload: Record<string, unknown>, fieldName: string): string | null => {
  const value = payload[fieldName];
  return typeof value === "string" ? value : null;
};

export const handleWebhook = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (!DYNAMO_DB_TABLE_NAME) {
    return jsonResponse(500, { message: "Missing DYNAMO_DB_TABLE_NAME environment variable" });
  }

  if (!MIDTRANS_SERVER_KEY) {
    return jsonResponse(500, { message: "Missing MIDTRANS_SERVER_KEY environment variable" });
  }

  let payload: Record<string, unknown>;

  try {
    payload = parseEventBody(event);
  } catch {
    return jsonResponse(400, { message: "Invalid JSON body" });
  }

  if (!validateWebhookSignature(payload, MIDTRANS_SERVER_KEY)) {
    return jsonResponse(401, { message: "Invalid Midtrans signature" });
  }

  const orderId = readStringField(payload, "order_id");

  if (!orderId) {
    return jsonResponse(400, { message: "Missing order_id" });
  }

  let existingOrder: PaymentOrderRecord | null;

  try {
    existingOrder = await readPaymentOrder(DYNAMO_DB_TABLE_NAME, orderId);
  } catch {
    return jsonResponse(502, { message: "Failed to read payment order" });
  }

  if (!existingOrder) {
    return jsonResponse(404, { message: "Payment order not found" });
  }

  const transactionStatus = readStringField(payload, "transaction_status");
  const fraudStatus = readStringField(payload, "fraud_status");
  const normalizedStatus = normalizePaymentStatus(transactionStatus, fraudStatus);
  const now = new Date().toISOString();

  const updatedOrder: PaymentOrderRecord = {
    ...existingOrder,
    status: normalizedStatus,
    transactionStatus: transactionStatus ?? undefined,
    statusCode: payload.status_code == null ? "" : String(payload.status_code),
    grossAmount: payload.gross_amount == null ? "" : String(payload.gross_amount),
    fraudStatus,
    paymentType: readStringField(payload, "payment_type"),
    transactionId: readStringField(payload, "transaction_id"),
    transactionTime: readStringField(payload, "transaction_time"),
    settlementTime: readStringField(payload, "settlement_time"),
    updatedAt: now
  };

  if (normalizedStatus === "SUCCESS" && !existingOrder.accessGrantedAt) {
    try {
      const expiryDate = await grantProductAccess(DYNAMO_DB_TABLE_NAME, existingOrder, now);
      updatedOrder.accessGrantedAt = now;
      updatedOrder.expiryDate = expiryDate;
    } catch {
      return jsonResponse(502, { message: "Failed to grant product access" });
    }
  }

  try {
    await savePaymentOrder(DYNAMO_DB_TABLE_NAME, updatedOrder);
  } catch {
    return jsonResponse(502, { message: "Failed to update payment order" });
  }

  return jsonResponse(200, {
    message: "Webhook processed",
    orderId,
    status: normalizedStatus
  });
};
