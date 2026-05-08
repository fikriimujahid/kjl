import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbDocumentClient } from "../clients/awsClients";
import { Product } from "../models/product";
import { isProduct } from "../utils/validators";
import { logProductServiceError } from "../utils/logger";

const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;

export const fetchProducts = async (): Promise<Product[]> => {
  const logContext = {
    tableName: DYNAMO_DB_TABLE_NAME,
    entityType: "PRODUCT",
    metadataSortKey: "METADATA"
  };

  try {
    const products: Product[] = [];
    let lastEvaluatedKey: Record<string, unknown> | undefined;

    do {
      const response = await dynamoDbDocumentClient.send(
        new ScanCommand({
          TableName: DYNAMO_DB_TABLE_NAME,
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
            ":productEntityType": "PRODUCT",
            ":metadataSortKey": "METADATA"
          },
          ExclusiveStartKey: lastEvaluatedKey
        })
      );

      const mappedItems = (response.Items ?? [])
        .filter(isProduct)
        .map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          shortDescription: item.shortDescription,
          level: item.level,
          topicsCount: item.topicsCount,
          featuredProducts: item.featuredProducts,
          accessDurationDays: item.accessDurationDays
        }));

      products.push(...mappedItems);
      lastEvaluatedKey = response.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastEvaluatedKey);

    return products;
  } catch (error) {
    logProductServiceError("dynamodb.listProducts.failure", logContext, error);
    throw error;
  }
};

export const findProductById = async (id: string): Promise<Product | null> => {
  const products = await fetchProducts();
  const product = products.find((item) => item.id === id);
  return product ?? null;
};
