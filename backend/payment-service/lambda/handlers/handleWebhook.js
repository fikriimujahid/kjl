"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = void 0;
const request_1 = require("../utils/request");
const response_1 = require("../utils/response");
const midtransService_1 = require("../services/midtransService");
const paymentRepository_1 = require("../services/paymentRepository");
const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const readStringField = (payload, fieldName) => {
    const value = payload[fieldName];
    return typeof value === "string" ? value : null;
};
const handleWebhook = async (event) => {
    if (!DYNAMO_DB_TABLE_NAME) {
        return (0, response_1.jsonResponse)(500, { message: "Missing DYNAMO_DB_TABLE_NAME environment variable" });
    }
    if (!MIDTRANS_SERVER_KEY) {
        return (0, response_1.jsonResponse)(500, { message: "Missing MIDTRANS_SERVER_KEY environment variable" });
    }
    let payload;
    try {
        payload = (0, request_1.parseEventBody)(event);
    }
    catch {
        return (0, response_1.jsonResponse)(400, { message: "Invalid JSON body" });
    }
    if (!(0, midtransService_1.validateWebhookSignature)(payload, MIDTRANS_SERVER_KEY)) {
        return (0, response_1.jsonResponse)(401, { message: "Invalid Midtrans signature" });
    }
    const orderId = readStringField(payload, "order_id");
    if (!orderId) {
        return (0, response_1.jsonResponse)(400, { message: "Missing order_id" });
    }
    let existingOrder;
    try {
        existingOrder = await (0, paymentRepository_1.readPaymentOrder)(DYNAMO_DB_TABLE_NAME, orderId);
    }
    catch {
        return (0, response_1.jsonResponse)(502, { message: "Failed to read payment order" });
    }
    if (!existingOrder) {
        return (0, response_1.jsonResponse)(404, { message: "Payment order not found" });
    }
    const transactionStatus = readStringField(payload, "transaction_status");
    const fraudStatus = readStringField(payload, "fraud_status");
    const normalizedStatus = (0, midtransService_1.normalizePaymentStatus)(transactionStatus, fraudStatus);
    const now = new Date().toISOString();
    const updatedOrder = {
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
            const expiryDate = await (0, paymentRepository_1.grantProductAccess)(DYNAMO_DB_TABLE_NAME, existingOrder, now);
            updatedOrder.accessGrantedAt = now;
            updatedOrder.expiryDate = expiryDate;
        }
        catch {
            return (0, response_1.jsonResponse)(502, { message: "Failed to grant product access" });
        }
    }
    try {
        await (0, paymentRepository_1.savePaymentOrder)(DYNAMO_DB_TABLE_NAME, updatedOrder);
    }
    catch {
        return (0, response_1.jsonResponse)(502, { message: "Failed to update payment order" });
    }
    return (0, response_1.jsonResponse)(200, {
        message: "Webhook processed",
        orderId,
        status: normalizedStatus
    });
};
exports.handleWebhook = handleWebhook;
