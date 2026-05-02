import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { randomUUID } from "crypto";
import { PaymentOrderRecord } from "../models/payment";
import { getAuthenticatedUser } from "../utils/auth";
import { parseEventBody } from "../utils/request";
import { jsonResponse } from "../utils/response";
import { createSnapTransaction, getMidtransSnapApiUrl } from "../services/midtransService";
import { savePaymentOrder } from "../services/paymentRepository";
import { fetchProductById } from "../services/productService";

const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_IS_PRODUCTION =
  (process.env.MIDTRANS_IS_PRODUCTION ?? "false").toLowerCase() === "true";
const MIDTRANS_SNAP_API_URL = getMidtransSnapApiUrl(
  MIDTRANS_IS_PRODUCTION,
  process.env.MIDTRANS_SNAP_API_URL
);
const PRODUCT_DATA_URL = process.env.PRODUCT_DATA_URL ?? "https://kjl.fikri.dev/public-data/product.json";
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

  let product;

  try {
    product = await fetchProductById(productId, PRODUCT_DATA_URL);
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

  const orderId = `KJL-${Date.now()}-${randomUUID().slice(0, 8)}`;

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
  } catch {
    return jsonResponse(502, { message: "Midtrans rejected payment creation" });
  }

  const now = new Date().toISOString();

  const paymentOrder: PaymentOrderRecord = {
    PK: `PAYMENT#${orderId}`,
    SK: "PAYMENT",
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
