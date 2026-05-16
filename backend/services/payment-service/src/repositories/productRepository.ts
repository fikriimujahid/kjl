import { selectItems } from "@shared-dynamodb/selectItems";
import { createLogger } from "@shared-utils/logger";
import { dynamoDbDocumentClient } from "../clients/awsClients";
import { isProduct, Product } from "../models/product";
import { getTableName } from "./paymentOrder.constants";

const logger = createLogger("payment-service");

const PRODUCT_PARTITION_KEY_PREFIX = "PRODUCT#";
const PRODUCT_METADATA_SORT_KEY = "METADATA";

type ProductRow = Product & Record<string, unknown>;

export const findProductById = async (
  productId: string
): Promise<Product | null> => {
  const tableName = getTableName();
  const productPartitionKey = `${PRODUCT_PARTITION_KEY_PREFIX}${productId}`;
  const logContext = {
    tableName,
    productId,
    productPartitionKey,
    metadataSortKey: PRODUCT_METADATA_SORT_KEY
  };

  try {
    const response = await selectItems<ProductRow>(dynamoDbDocumentClient, {
      from: tableName,
      select: ["id", "name", "price", "accessDurationDays", "level"],
      keyWhere: {
        PK: productPartitionKey,
        SK: PRODUCT_METADATA_SORT_KEY
      }
    });

    const product = response.items[0];

    if (!isProduct(product)) {
      return null;
    }

    return product;
  } catch (error) {
    logger.error("dynamodb.product.lookup.failed", {
      ...logContext,
      error
    });
    throw error;
  }
};