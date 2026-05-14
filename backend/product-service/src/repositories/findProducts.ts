import { Product } from "../types/productTypes";
import { logProductServiceError } from "../utils/logger";
import { scanAll } from "../lib/dynamodb/scanAll";
import {
  PRODUCT_ENTITY_TYPE,
  PRODUCT_METADATA_SORT_KEY,
  getProductTableName
} from "./product.constants";
import { mapProductItem } from "./mapProductItem";

export const findProducts = async (): Promise<Product[]> => {
  const tableName = getProductTableName();
  const logContext = {
    tableName,
    entityType: PRODUCT_ENTITY_TYPE,
    metadataSortKey: PRODUCT_METADATA_SORT_KEY
  };

  try {
    const items = await scanAll({
      tableName,
      input: {
        ProjectionExpression: "#pk, #sk, #entityType, #id, #name, #price, #shortDescription, #level, #topicsCount, #featuredProducts, #accessDurationDays",
        FilterExpression: "#entityType = :productEntityType AND #sk = :metadataSortKey",
        ExpressionAttributeNames: {
          "#pk": "PK",
          "#sk": "SK",
          "#entityType": "entityType",
          "#id": "id",
          "#name": "name",
          "#price": "price",
          "#shortDescription": "shortDescription",
          "#level": "level",
          "#topicsCount": "topicsCount",
          "#featuredProducts": "featuredProducts",
          "#accessDurationDays": "accessDurationDays"
        },
        ExpressionAttributeValues: {
          ":productEntityType": PRODUCT_ENTITY_TYPE,
          ":metadataSortKey": PRODUCT_METADATA_SORT_KEY
        }
      }
    });

    return items
      .map(mapProductItem)
      .filter((product): product is Product => Boolean(product));
  } catch (error) {
    logProductServiceError("dynamodb.listProducts.failure", logContext, error);
    throw error;
  }
};
