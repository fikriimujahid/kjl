"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePaymentStatus = exports.validateWebhookSignature = exports.createSnapTransaction = void 0;
const crypto_1 = require("crypto");
const safeEqualString = (left, right) => {
    const leftBuffer = Buffer.from(left, "utf8");
    const rightBuffer = Buffer.from(right, "utf8");
    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }
    return (0, crypto_1.timingSafeEqual)(leftBuffer, rightBuffer);
};
const toMidtransAuthHeader = (serverKey) => {
    const encodedCredential = Buffer.from(`${serverKey}:`).toString("base64");
    return `Basic ${encodedCredential}`;
};
const calculateMidtransSignature = (orderId, statusCode, grossAmount, serverKey) => {
    return (0, crypto_1.createHash)("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest("hex");
};
const readStringField = (payload, fieldName) => {
    const value = payload[fieldName];
    return typeof value === "string" ? value : null;
};
const createSnapTransaction = async (input) => {
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
    const data = (await response.json());
    const token = readStringField(data, "token");
    if (!token) {
        throw new Error("Midtrans Snap token was not returned");
    }
    return {
        token,
        redirectUrl: readStringField(data, "redirect_url")
    };
};
exports.createSnapTransaction = createSnapTransaction;
const validateWebhookSignature = (payload, serverKey) => {
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
exports.validateWebhookSignature = validateWebhookSignature;
const normalizePaymentStatus = (transactionStatus, fraudStatus) => {
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
exports.normalizePaymentStatus = normalizePaymentStatus;
