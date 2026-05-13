import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { randomUUID } from "crypto";
import { PaymentOrderRecord } from "../models/payment";
import { getAuthenticatedUser } from "../utils/auth";
import { parseEventBody } from "../utils/request";
import { jsonResponse } from "../utils/response";
import { createSnapTransaction } from "../services/midtransService";
import { hasActiveProductAccess, savePaymentOrder } from "../services/paymentRepository";
import { fetchProductById } from "../services/productService";

const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_SNAP_API_URL = process.env.MIDTRANS_SNAP_API_URL;
const APP_BASE_URL = (process.env.APP_BASE_URL ?? "").trim().replace(/\/$/, "");

export const createPayment = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (!DYNAMO_DB_TABLE_NAME) {
    return jsonResponse(500, { message: "Missing DYNAMO_DB_TABLE_NAME environment variable" });
  }

  if (!MIDTRANS_SERVER_KEY) {
    return jsonResponse(500, { message: "Missing MIDTRANS_SERVER_KEY environment variable" });
  }

  if (!MIDTRANS_SNAP_API_URL) {
    return jsonResponse(500, { message: "Missing MIDTRANS_SNAP_API_URL environment variable" });
  }

  const authenticatedUser = getAuthenticatedUser(event);

  if (!authenticatedUser) {
    return jsonResponse(401, { message: "Unauthorized" });
  }

  let payload: Record<string, unknown>;

  try {
    payload = parseEventBody(event);
  } catch {
    return jsonResponse(400, { message: "Invalid JSON body" });
  }

  const productId = typeof payload.productId === "string" ? payload.productId.trim() : "";

  if (!productId) {
    return jsonResponse(400, { message: "Missing productId" });
  }

  try {
    const hasActiveAccess = await hasActiveProductAccess(
      DYNAMO_DB_TABLE_NAME,
      authenticatedUser.id,
      productId
    );

    if (hasActiveAccess) {
      return jsonResponse(409, { message: "User already has the product" });
    }
  } catch {
    return jsonResponse(502, { message: "Failed to validate existing product access" });
  }

  let product;

  try {
    product = await fetchProductById(productId, DYNAMO_DB_TABLE_NAME);
  } catch {
    return jsonResponse(502, { message: "Failed to load product data" });
  }

  if (!product) {
    return jsonResponse(404, { message: "Product not found" });
  }

  const amount = Math.round(product.price);

  if (amount <= 0) {
    return jsonResponse(400, { message: "Invalid product price" });
  }

  const orderIdTimestamp = Date.now().toString(36);
  const orderIdRandomChar = randomUUID().replace(/-/g, "").slice(0, 1);
  const orderId = `KJL~${authenticatedUser.id}~${orderIdTimestamp}${orderIdRandomChar}`;

  if (orderId.length > 50) {
    return jsonResponse(400, { message: "Unable to create valid order id for this user" });
  }

  const snapPayload: Record<string, unknown> = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    item_details: [
      {
        id: product.id,
        name: product.name,
        price: amount,
        quantity: 1
      }
    ],
    customer_details: {
      first_name: authenticatedUser.name || authenticatedUser.email || authenticatedUser.id,
      email: authenticatedUser.email || undefined
    }
  };

  if (APP_BASE_URL) {
    snapPayload.callbacks = {
      finish: `${APP_BASE_URL}/payment-success`,
      error: `${APP_BASE_URL}/payment-failed`,
      pending: `${APP_BASE_URL}/payment-success?pending=1`
    };
  }

  let snapData;

  try {
    snapData = await createSnapTransaction({
      serverKey: MIDTRANS_SERVER_KEY,
      snapApiUrl: MIDTRANS_SNAP_API_URL,
      payload: snapPayload
    });
  } catch (error) {
    console.error("[MIDTRANS_SNAP_CREATE_FAILED]", {
      orderId,
      userId: authenticatedUser.id,
      productId,
      snapApiUrl: MIDTRANS_SNAP_API_URL,
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonResponse(502, { message: "Midtrans rejected payment creation" });
  }

  const now = new Date().toISOString();

  const paymentOrder: PaymentOrderRecord = {
    PK: `PAYMENT#${authenticatedUser.id}`,
    SK: `PAYMENT#${orderId}`,
    entityType: "PAYMENT_ORDER",
    orderId,
    userId: authenticatedUser.id,
    productId: product.id,
    productName: product.name,
    amount,
    grossAmount: amount.toFixed(2),
    accessDurationDays: product.accessDurationDays,
    snapToken: snapData.token,
    snapRedirectUrl: snapData.redirectUrl,
    status: "CREATED",
    paymentProvider: "MIDTRANS",
    createdAt: now,
    updatedAt: now
  };

  try {
    await savePaymentOrder(DYNAMO_DB_TABLE_NAME, paymentOrder);
  } catch {
    return jsonResponse(502, { message: "Failed to persist payment order" });
  }

  return jsonResponse(200, {
    orderId,
    snapToken: snapData.token,
    redirectUrl: paymentOrder.snapRedirectUrl
  });
};
