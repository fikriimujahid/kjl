import { createItem } from "@shared-dynamodb/createItem";
import { selectItems } from "@shared-dynamodb/selectItems";
import { createLogger } from "@shared-utils/logger";
import { InternalApiClientError } from "@shared-utils/internalApiClient";
import { getPaymentServiceEnv } from "../config/env";
import { PaymentOrderRecord } from "../models/payment";
import { createDynamoDocumentClient } from "@shared-dynamodb/client";
import {
  PAYMENT_PARTITION_KEY_PREFIX,
  PAYMENT_SORT_KEY_PREFIX,
  OWNED_PRODUCT_PARTITION_KEY_PREFIX,
  PURCHASE_SORT_KEY_PREFIX,
  DAY_IN_MILLISECONDS
} from "./paymentOrder.constants";

const logger = createLogger("payment-service");

export const savePaymentOrder = async (
  order: PaymentOrderRecord
): Promise<void> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getPaymentServiceEnv().DYNAMO_DB_TABLE_NAME;

  try {
    await createItem(dynamoDbDocumentClient, {
      TableName: tableName,
      Item: order as PaymentOrderRecord & Record<string, unknown>
    });
  } catch (error) {
    logger.error("dynamodb.paymentOrder.save.failed", {
      tableName,
      orderId: order.orderId,
      userId: order.userId,
      productId: order.productId,
      error
    });
    throw error;
  }
};

const extractUserIdFromOrderId = (orderId: string): string | null => {
  const parts = orderId.split("~");

  if (parts.length !== 3 || parts[0] !== "KJL") {
    return null;
  }

  const userId = parts[1]?.trim();

  return userId ? userId : null;
};

export const findPaymentOrderById = async (
  orderId: string
): Promise<PaymentOrderRecord | null> => {
  const userId = extractUserIdFromOrderId(orderId);

  if (!userId) {
    return null;
  }

  const paymentPartitionKey = `${PAYMENT_PARTITION_KEY_PREFIX}${userId}`;
  const paymentSortKey = `${PAYMENT_SORT_KEY_PREFIX}${orderId}`;
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getPaymentServiceEnv().DYNAMO_DB_TABLE_NAME;

  try {
    const response = await selectItems<PaymentOrderRecord & Record<string, unknown>>(dynamoDbDocumentClient, {
      from: tableName,
      keyWhere: {
        PK: paymentPartitionKey,
        SK: paymentSortKey
      }
    });

    return response.items[0] ?? null;
  } catch (error) {
    logger.error("dynamodb.paymentOrder.lookup.failed", {
      tableName,
      orderId,
      paymentPartitionKey,
      paymentSortKey,
      error
    });
    throw error;
  }
};

export const listPaymentOrdersByUserId = async (
  userId: string
): Promise<PaymentOrderRecord[]> => {
  const paymentPartitionKey = `${PAYMENT_PARTITION_KEY_PREFIX}${userId}`;
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getPaymentServiceEnv().DYNAMO_DB_TABLE_NAME;

  try {
    const response = await selectItems<PaymentOrderRecord & Record<string, unknown>>(dynamoDbDocumentClient, {
      from: tableName,
      keyWhere: {
        PK: paymentPartitionKey
      },
      keyBeginsWith: {
        SK: PAYMENT_SORT_KEY_PREFIX
      }
    });

    return response.items;
  } catch (error) {
    logger.error("dynamodb.paymentOrder.list.failed", {
      tableName,
      userId,
      paymentPartitionKey,
      error
    });
    throw error;
  }
};

export const grantProductAccess = async (
  order: PaymentOrderRecord,
  nowIsoString: string
): Promise<string> => {
  const purchaseKey = {
    PK: `${OWNED_PRODUCT_PARTITION_KEY_PREFIX}${order.userId}`,
    SK: `${PURCHASE_SORT_KEY_PREFIX}${order.productId}`
  };
  const accessDurationDays = Number.isFinite(order.accessDurationDays)
    ? Math.max(1, Math.floor(order.accessDurationDays))
    : 30;
  const nowDate = new Date(nowIsoString);
  const nextExpiryDate = new Date(
    nowDate.getTime() + accessDurationDays * DAY_IN_MILLISECONDS
  ).toISOString();

  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getPaymentServiceEnv().DYNAMO_DB_TABLE_NAME;

  try {
    await createItem(dynamoDbDocumentClient, {
      TableName: tableName,
      Item: {
        ...purchaseKey,
        id: order.productId,
        entityType: "PURCHASE",
        userId: order.userId,
        productId: order.productId,
        purchaseId: order.orderId,
        name: order.name,
        level: order.level,
        purchaseDate: nowIsoString,
        expiryDate: nextExpiryDate,
        updatedAt: nowIsoString
      }
    });
  } catch (error) {
    logger.error("dynamodb.productAccess.grant.failed", {
      tableName,
      orderId: order.orderId,
      userId: order.userId,
      productId: order.productId,
      accessDurationDays,
      expiryDate: nextExpiryDate,
      error
    });
    throw error;
  }

  return nextExpiryDate;
};