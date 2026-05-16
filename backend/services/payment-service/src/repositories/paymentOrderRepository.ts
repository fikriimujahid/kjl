import { createItem } from "@shared-dynamodb/createItem";
import { selectItems } from "@shared-dynamodb/selectItems";
import { createLogger } from "@shared-utils/logger";
import { InternalApiClientError } from "@shared-utils/internalApiClient";
import { getOwnedProductsByUserId } from "../clients/productServiceInternalClient";
import { dynamoDbDocumentClient } from "../clients/awsClients";
import { PaymentOrderRecord } from "../models/payment";

const logger = createLogger("payment-service");

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const PAYMENT_PARTITION_KEY_PREFIX = "PAYMENT#";
const OWNED_PRODUCT_PARTITION_KEY_PREFIX = "OWNED_PRODUCT#";
const PAYMENT_SORT_KEY_PREFIX = "PAYMENT#";
const PURCHASE_SORT_KEY_PREFIX = "PURCHASE#";

type PaymentOrderRow = PaymentOrderRecord & Record<string, unknown>;
const extractUserIdFromOrderId = (orderId: string): string | null => {
  const parts = orderId.split("~");

  if (parts.length !== 3 || parts[0] !== "KJL") {
    return null;
  }

  const userId = parts[1]?.trim();

  return userId ? userId : null;
};

export const findPaymentOrderById = async (
  tableName: string,
  orderId: string
): Promise<PaymentOrderRecord | null> => {
  const userId = extractUserIdFromOrderId(orderId);

  if (!userId) {
    return null;
  }

  const paymentPartitionKey = `${PAYMENT_PARTITION_KEY_PREFIX}${userId}`;
  const paymentSortKey = `${PAYMENT_SORT_KEY_PREFIX}${orderId}`;

  try {
    const response = await selectItems<PaymentOrderRow>(dynamoDbDocumentClient, {
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

export const savePaymentOrder = async (
  tableName: string,
  order: PaymentOrderRecord
): Promise<void> => {
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

export const hasActiveProductAccess = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  try {
    const ownedProducts = await getOwnedProductsByUserId(userId);
    return ownedProducts.some((ownedProduct) => ownedProduct.productId === productId);
  } catch (error) {
    logger.error("product-service.productAccess.lookup.failed", {
      userId,
      productId,
      error: error instanceof InternalApiClientError
        ? {
            message: error.message,
            statusCode: error.statusCode,
            code: error.code
          }
        : error
    });
    throw error;
  }
};

export const grantProductAccess = async (
  tableName: string,
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
        name: order.productName,
        level: order.productLevel ?? "",
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