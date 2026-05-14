import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { PaymentOrderRecord } from "../models/payment";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const extractUserIdFromOrderId = (orderId: string): string | null => {
  const parts = orderId.split("~");

  if (parts.length !== 3) {
    return null;
  }

  if (parts[0] !== "KJL") {
    return null;
  }

  const userId = parts[1]?.trim();

  if (!userId) {
    return null;
  }

  return userId;
};

const readExpiryDate = (value: unknown): Date | null => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

export const readPaymentOrder = async (
  tableName: string,
  orderId: string
): Promise<PaymentOrderRecord | null> => {
  const userId = extractUserIdFromOrderId(orderId);

  if (!userId) {
    return null;
  }

  const response = await dynamoDbClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `PAYMENT#${userId}`,
        SK: `PAYMENT#${orderId}`
      }
    })
  );

  return (response.Item as PaymentOrderRecord | undefined) ?? null;
};

export const savePaymentOrder = async (
  tableName: string,
  order: PaymentOrderRecord
): Promise<void> => {
  await dynamoDbClient.send(
    new PutCommand({
      TableName: tableName,
      Item: order
    })
  );
};

export const hasActiveProductAccess = async (
  tableName: string,
  userId: string,
  productId: string
): Promise<boolean> => {
  const response = await dynamoDbClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `OWNED_PRODUCT#${userId}`,
        SK: `PURCHASE#${productId}`
      }
    })
  );

  const purchaseRecord = (response.Item as Record<string, unknown> | undefined) ?? null;

  if (!purchaseRecord) {
    return false;
  }

  const expiryDate = readExpiryDate(purchaseRecord.expiryDate);

  if (!expiryDate) {
    return false;
  }

  return expiryDate > new Date();
};

export const grantProductAccess = async (
  tableName: string,
  order: PaymentOrderRecord,
  nowIsoString: string
): Promise<string> => {
  const purchaseKey = {
    PK: `OWNED_PRODUCT#${order.userId}`,
    SK: `PURCHASE#${order.productId}`
  };

  const accessDurationDays = Number.isFinite(order.accessDurationDays)
    ? Math.max(1, Math.floor(order.accessDurationDays))
    : 30;

  const nowDate = new Date(nowIsoString);
  const nextExpiryDate = new Date(nowDate.getTime() + accessDurationDays * DAY_IN_MILLISECONDS).toISOString();

  await dynamoDbClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        ...purchaseKey,
        entityType: "PURCHASE",
        userId: order.userId,
        productId: order.productId,
        purchaseId: order.orderId,
        purchaseDate: nowIsoString,
        expiryDate: nextExpiryDate,
        updatedAt: nowIsoString
      }
    })
  );

  return nextExpiryDate;
};
