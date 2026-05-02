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
const MIDTRANS_IS_PRODUCTION = (process.env.MIDTRANS_IS_PRODUCTION ?? "false").toLowerCase() === "true";
const MIDTRANS_SNAP_API_URL = (0, midtransService_1.getMidtransSnapApiUrl)(MIDTRANS_IS_PRODUCTION, process.env.MIDTRANS_SNAP_API_URL);
const PRODUCT_DATA_URL = process.env.PRODUCT_DATA_URL ?? "https://kjl.fikri.dev/public-data/product.json";
const APP_BASE_URL = (process.env.APP_BASE_URL ?? "").trim().replace(/\/$/, "");
const createPayment = async (event) => {
    if (!DYNAMO_DB_TABLE_NAME) {
        return (0, response_1.jsonResponse)(500, { message: "Missing DYNAMO_DB_TABLE_NAME environment variable" });
    }
    if (!MIDTRANS_SERVER_KEY) {
        return (0, response_1.jsonResponse)(500, { message: "Missing MIDTRANS_SERVER_KEY environment variable" });
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
    let product;
    try {
        product = await (0, productService_1.fetchProductById)(productId, PRODUCT_DATA_URL);
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
    const orderId = `KJL-${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}`;
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
