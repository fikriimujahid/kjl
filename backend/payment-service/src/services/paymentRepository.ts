import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { PaymentOrderRecord } from "../models/payment";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const readPaymentOrder = async (
  tableName: string,
  orderId: string
): Promise<PaymentOrderRecord | null> => {
  const response = await dynamoDbClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `PAYMENT#${orderId}`,
        SK: "PAYMENT"
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

export const grantProductAccess = async (
  tableName: string,
  order: PaymentOrderRecord,
  nowIsoString: string
): Promise<string> => {
  const purchaseKey = {
    PK: `USER#${order.userId}`,
    SK: `PURCHASE#${order.productId}`
  };

  const existingPurchaseResponse = await dynamoDbClient.send(
    new GetCommand({
      TableName: tableName,
      Key: purchaseKey
    })
  );

  const existingPurchase = (existingPurchaseResponse.Item as Record<string, unknown> | undefined) ?? null;

  if (
    existingPurchase &&
    typeof existingPurchase.purchaseId === "string" &&
    existingPurchase.purchaseId === order.orderId &&
    typeof existingPurchase.expiryDate === "string"
  ) {
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
        paymentProvider: "MIDTRANS",
        paymentStatus: "SUCCESS",
        amount: order.amount,
        updatedAt: nowIsoString
      }
    })
  );

  return nextExpiryDate;
};
