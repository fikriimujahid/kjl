"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grantProductAccess = exports.savePaymentOrder = exports.readPaymentOrder = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const dynamoDbClient = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({}));
const readPaymentOrder = async (tableName, orderId) => {
    const response = await dynamoDbClient.send(new lib_dynamodb_1.GetCommand({
        TableName: tableName,
        Key: {
            PK: `PAYMENT#${orderId}`,
            SK: "PAYMENT"
        }
    }));
    return response.Item ?? null;
};
exports.readPaymentOrder = readPaymentOrder;
const savePaymentOrder = async (tableName, order) => {
    await dynamoDbClient.send(new lib_dynamodb_1.PutCommand({
        TableName: tableName,
        Item: order
    }));
};
exports.savePaymentOrder = savePaymentOrder;
const grantProductAccess = async (tableName, order, nowIsoString) => {
    const purchaseKey = {
        PK: `USER#${order.userId}`,
        SK: `PURCHASE#${order.productId}`
    };
    const existingPurchaseResponse = await dynamoDbClient.send(new lib_dynamodb_1.GetCommand({
        TableName: tableName,
        Key: purchaseKey
    }));
    const existingPurchase = existingPurchaseResponse.Item ?? null;
    if (existingPurchase &&
        typeof existingPurchase.purchaseId === "string" &&
        existingPurchase.purchaseId === order.orderId &&
        typeof existingPurchase.expiryDate === "string") {
        return existingPurchase.expiryDate;
    }
    const accessDurationDays = Number.isFinite(order.accessDurationDays)
        ? Math.max(1, Math.floor(order.accessDurationDays))
        : 30;
    const nowDate = new Date(nowIsoString);
    let baseDate = nowDate;
    if (existingPurchase && typeof existingPurchase.expiryDate === "string") {
        const currentExpiryDate = new Date(existingPurchase.expiryDate);
        if (!Number.isNaN(currentExpiryDate.getTime()) && currentExpiryDate > nowDate) {
            baseDate = currentExpiryDate;
        }
    }
    const nextExpiryDate = new Date(baseDate.getTime() + accessDurationDays * DAY_IN_MILLISECONDS).toISOString();
    await dynamoDbClient.send(new lib_dynamodb_1.PutCommand({
        TableName: tableName,
        Item: {
            ...purchaseKey,
            entityType: "PURCHASE",
            userId: order.userId,
            productId: order.productId,
            purchaseId: order.orderId,
            purchaseDate: nowIsoString,
            expiryDate: nextExpiryDate,
            paymentProvider: "MIDTRANS",
            paymentStatus: "SUCCESS",
            amount: order.amount,
            updatedAt: nowIsoString
        }
    }));
    return nextExpiryDate;
};
exports.grantProductAccess = grantProductAccess;
