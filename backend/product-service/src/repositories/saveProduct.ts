import { ProductDetail } from "../types/productTypes";
import { logProductServiceError } from "../utils/logger";
import { putItem } from "../lib/dynamodb/putItem";
import {
  PRODUCT_ENTITY_TYPE,
  PRODUCT_METADATA_SORT_KEY,
  PRODUCT_PARTITION_KEY_PREFIX,
  getProductTableName
} from "./product.constants";

export const saveProduct = async (product: ProductDetail): Promise<void> => {
  const tableName = getProductTableName();
  const productPartitionKey = `${PRODUCT_PARTITION_KEY_PREFIX}${product.id}`;
  const logContext = {
    tableName,
    productId: product.id,
    productPartitionKey,
    metadataSortKey: PRODUCT_METADATA_SORT_KEY
  };

  try {
    await putItem({
      tableName,
      input: {},
      item: {
        PK: productPartitionKey,
        SK: PRODUCT_METADATA_SORT_KEY,
        entityType: PRODUCT_ENTITY_TYPE,
        id: product.id,
        name: product.name,
        price: product.price,
        shortDescription: product.shortDescription,
        level: product.level,
        topicsCount: product.topicsCount,
        featuredProducts: product.featuredProducts,
        accessDurationDays: product.accessDurationDays,
        description: product.description
      }
    });
  } catch (error) {
    logProductServiceError("dynamodb.saveProduct.failure", logContext, error);
    throw error;
  }
};
