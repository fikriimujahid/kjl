import { selectItems } from "@shared-dynamodb/selectItems";
import { createLogger } from "@shared-utils/logger";
import { Product } from "../types/productTypes";
import {
  productListColumns,
  PRODUCT_ENTITY_TYPE,
  PRODUCT_METADATA_SORT_KEY
} from "./product.constants";
import { createDynamoDocumentClient } from "@shared-dynamodb/client";
import { getProductServiceEnv } from "../config/env";

const logger = createLogger("product-service");

export const findProducts = async (): Promise<Product[]> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getProductServiceEnv().DYNAMO_DB_TABLE_NAME;
  const logContext = {
    tableName,
    entityType: PRODUCT_ENTITY_TYPE,
    metadataSortKey: PRODUCT_METADATA_SORT_KEY
  };

  try {
    const response = await selectItems<Product & Record<string, unknown>>(dynamoDbDocumentClient, {
      from: tableName,
      select: productListColumns,
      where: {
        entityType: PRODUCT_ENTITY_TYPE,
        SK: PRODUCT_METADATA_SORT_KEY
      }
    });

    return response.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      shortDescription: item.shortDescription,
      level: item.level,
      topicsCount: item.topicsCount,
      featuredProducts: item.featuredProducts,
      accessDurationDays: item.accessDurationDays
    }));

  } catch (error) {
    logger.error("dynamodb.listProducts.failure", {
      ...logContext,
      error
    });
    throw error;
  }
};