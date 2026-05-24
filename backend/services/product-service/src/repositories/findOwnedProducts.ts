import { selectItems } from "@shared-dynamodb/selectItems";
import { createLogger } from "@shared-utils/logger";
import { OwnedProduct } from "../types/productTypes";
import { createDynamoDocumentClient } from "@shared-dynamodb/client";
import { getProductServiceEnv } from "../config/env";

const logger = createLogger("product-service");
const PURCHASE_PARTITION_KEY_PREFIX = "OWNED_PRODUCT#";
const PURCHASE_SORT_KEY_PREFIX = "PURCHASE#";

export const findOwnedProducts = async (
  userId: string
): Promise<OwnedProduct[]> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getProductServiceEnv().DYNAMO_DB_TABLE_NAME;
  const purchasePartitionKey = `${PURCHASE_PARTITION_KEY_PREFIX}${userId}`;
  const currentDate = new Date().toISOString();
  const logContext = {
    userId,
    tableName,
    purchasePartitionKey,
    purchaseSortKeyPrefix: PURCHASE_SORT_KEY_PREFIX,
    currentDate
  };

  try {
    const response = await selectItems<OwnedProduct & Record<string, unknown>>(dynamoDbDocumentClient, {
      from: tableName,
      keyWhere: {
        PK: purchasePartitionKey
      },
      keyBeginsWith: {
        SK: PURCHASE_SORT_KEY_PREFIX
      },
      where: {
        expiryDate: {
          gt: currentDate
        }
      }
    });
    
    return response.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      userId: item.userId,
      level: item.level,
      name: item.name,
      purchaseDate: item.purchaseDate,
      expiryDate: item.expiryDate
    }));

  } catch (error) {
    logger.error("dynamodb.listPurchases.failure", {
      ...logContext,
      error
    });
    throw error;
  }
};