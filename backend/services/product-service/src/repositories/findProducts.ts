import { selectItems } from "@shared-dynamodb/selectItems";
import { createLogger } from "@shared-utils/logger";
import { dynamoDbDocumentClient } from "../clients/awsClients";
import { Product } from "../types/productTypes";
import {
  getProductTableName,
  PRODUCT_ENTITY_TYPE,
  PRODUCT_METADATA_SORT_KEY
} from "./product.constants";

const logger = createLogger("product-service");

const productListColumns = [
  "PK",
  "SK",
  "entityType",
  "id",
  "name",
  "price",
  "shortDescription",
  "level",
  "topicsCount",
  "featuredProducts",
  "accessDurationDays"
];

export const findProducts = async (): Promise<Product[]> => {
  const tableName = getProductTableName();
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