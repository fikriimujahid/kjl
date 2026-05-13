"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = void 0;
const crypto_1 = require("crypto");
const auth_1 = require("../utils/auth");
const request_1 = require("../utils/request");
const response_1 = require("../utils/response");
const midtransService_1 = require("../services/midtransService");
const paymentRepository_1 = require("../services/paymentRepository");
const productService_1 = require("../services/productService");
const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_SNAP_API_URL = process.env.MIDTRANS_SNAP_API_URL;
const APP_BASE_URL = (process.env.APP_BASE_URL ?? "").trim().replace(/\/$/, "");
const createPayment = async (event) => {
    if (!DYNAMO_DB_TABLE_NAME) {
        return (0, response_1.jsonResponse)(500, { message: "Missing DYNAMO_DB_TABLE_NAME environment variable" });
    }
    if (!MIDTRANS_SERVER_KEY) {
        return (0, response_1.jsonResponse)(500, { message: "Missing MIDTRANS_SERVER_KEY environment variable" });
    }
    if (!MIDTRANS_SNAP_API_URL) {
        return (0, response_1.jsonResponse)(500, { message: "Missing MIDTRANS_SNAP_API_URL environment variable" });
    }
    const authenticatedUser = (0, auth_1.getAuthenticatedUser)(event);
    if (!authenticatedUser) {
        return (0, response_1.jsonResponse)(401, { message: "Unauthorized" });
    }
    let payload;
    try {
        payload = (0, request_1.parseEventBody)(event);
    }
    catch {
        return (0, response_1.jsonResponse)(400, { message: "Invalid JSON body" });
    }
    const productId = typeof payload.productId === "string" ? payload.productId.trim() : "";
    if (!productId) {
        return (0, response_1.jsonResponse)(400, { message: "Missing productId" });
    }
    try {
        const hasActiveAccess = await (0, paymentRepository_1.hasActiveProductAccess)(DYNAMO_DB_TABLE_NAME, authenticatedUser.id, productId);
        if (hasActiveAccess) {
            return (0, response_1.jsonResponse)(409, { message: "User already has the product" });
        }
    }
    catch {
        return (0, response_1.jsonResponse)(502, { message: "Failed to validate existing product access" });
    }
    let product;
    try {
        product = await (0, productService_1.fetchProductById)(productId, DYNAMO_DB_TABLE_NAME);
    }
    catch {
        return (0, response_1.jsonResponse)(502, { message: "Failed to load product data" });
    }
    if (!product) {
        return (0, response_1.jsonResponse)(404, { message: "Product not found" });
    }
    const amount = Math.round(product.price);
    if (amount <= 0) {
        return (0, response_1.jsonResponse)(400, { message: "Invalid product price" });
    }
    const orderIdTimestamp = Date.now().toString(36);
    const orderIdRandomChar = (0, crypto_1.randomUUID)().replace(/-/g, "").slice(0, 1);
    const orderId = `KJL~${authenticatedUser.id}~${orderIdTimestamp}${orderIdRandomChar}`;
    if (orderId.length > 50) {
        return (0, response_1.jsonResponse)(400, { message: "Unable to create valid order id for this user" });
    }
    const snapPayload = {
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
        snapData = await (0, midtransService_1.createSnapTransaction)({
            serverKey: MIDTRANS_SERVER_KEY,
            snapApiUrl: MIDTRANS_SNAP_API_URL,
            payload: snapPayload
        });
    }
    catch {
        return (0, response_1.jsonResponse)(502, { message: "Midtrans rejected payment creation" });
    }
    const now = new Date().toISOString();
    const paymentOrder = {
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
        await (0, paymentRepository_1.savePaymentOrder)(DYNAMO_DB_TABLE_NAME, paymentOrder);
    }
    catch {
        return (0, response_1.jsonResponse)(502, { message: "Failed to persist payment order" });
    }
    return (0, response_1.jsonResponse)(200, {
        orderId,
        snapToken: snapData.token,
        redirectUrl: paymentOrder.snapRedirectUrl
    });
};
exports.createPayment = createPayment;
