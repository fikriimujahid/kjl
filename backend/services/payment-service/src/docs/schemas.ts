import { OpenApiSchemaObject } from "@shared-swagger/openapi";

export const createPaymentRequestSchema: OpenApiSchemaObject = {
  type: "object",
  required: ["productId"],
  properties: {
    productId: { type: "string" }
  }
};

export const createPaymentResponseSchema: OpenApiSchemaObject = {
  type: "object",
  required: ["orderId", "snapToken"],
  properties: {
    orderId: { type: "string" },
    snapToken: { type: "string" },
    redirectUrl: {
      oneOf: [{ type: "string" }, { type: "null" }]
    }
  }
};

export const paymentHistoryItemSchema: OpenApiSchemaObject = {
  type: "object",
  required: ["orderId", "productName", "amount", "status", "createdAt"],
  properties: {
    orderId: { type: "string" },
    productName: { type: "string" },
    amount: { type: "number" },
    status: {
      type: "string",
      enum: ["CREATED", "SUCCESS", "PENDING", "PENDING_REVIEW", "FAILED", "REFUNDED", "UNKNOWN"]
    },
    createdAt: { type: "string", format: "date-time" }
  }
};

export const paymentHistoryResponseSchema: OpenApiSchemaObject = {
  type: "array",
  items: paymentHistoryItemSchema
};

export const webhookRequestSchema: OpenApiSchemaObject = {
  type: "object",
  properties: {
    order_id: { type: "string" },
    transaction_status: { type: "string" },
    status_code: {
      oneOf: [{ type: "string" }, { type: "number" }]
    },
    gross_amount: {
      oneOf: [{ type: "string" }, { type: "number" }]
    },
    fraud_status: { type: "string" },
    payment_type: { type: "string" },
    transaction_id: { type: "string" },
    transaction_time: { type: "string", format: "date-time" },
    settlement_time: { type: "string", format: "date-time" },
    signature_key: { type: "string" }
  },
  additionalProperties: true
};

export const paymentStatusSchema: OpenApiSchemaObject = {
  type: "string",
  enum: ["CREATED", "SUCCESS", "PENDING", "PENDING_REVIEW", "FAILED", "REFUNDED", "UNKNOWN"]
};

export const webhookResponseSchema: OpenApiSchemaObject = {
  type: "object",
  required: ["message", "orderId", "status"],
  properties: {
    message: { type: "string" },
    orderId: { type: "string" },
    status: paymentStatusSchema
  }
};