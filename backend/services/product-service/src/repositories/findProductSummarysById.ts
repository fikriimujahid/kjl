import { selectItems } from "@shared-dynamodb/selectItems";
import { createLogger } from "@shared-utils/logger";
import { createDynamoDocumentClient } from "@shared-dynamodb/client";
import { getProductServiceEnv } from "../config/env";
import {
  productListColumns,
  PRODUCT_METADATA_SORT_KEY,
  PRODUCT_PARTITION_KEY_PREFIX
} from "./product.constants";
import { Product } from "../types/productTypes";

const logger = createLogger("product-service");

export const findProductSummarysById = async (
  productId: string
): Promise<Product> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getProductServiceEnv().DYNAMO_DB_TABLE_NAME;
  const productPartitionKey = `${PRODUCT_PARTITION_KEY_PREFIX}${productId}`;

  try {
    const response = await selectItems<Product & Record<string, unknown>>(dynamoDbDocumentClient, {
      from: tableName,
      select: productListColumns,
      keyWhere: {
        PK: productPartitionKey,
        SK: PRODUCT_METADATA_SORT_KEY
      }
    }); 

    return {
      id: response.items[0].id,
      name: response.items[0].name,
      price: response.items[0].price,
      normalPrice: response.items[0].normalPrice,
      shortDescription: response.items[0].shortDescription,
      level: response.items[0].level,
      topicsCount: response.items[0].topicsCount,
      featuredProducts: response.items[0].featuredProducts,
      accessDurationDays: response.items[0].accessDurationDays
    };
  } catch (error) {
    logger.error("dynamodb.findProductSummarysById.failure", {
      productId,
      tableName,
      productPartitionKey,
      metadataSortKey: PRODUCT_METADATA_SORT_KEY,
      error
    });
    throw error;
  }
};
