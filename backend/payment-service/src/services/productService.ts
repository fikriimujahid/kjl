import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { isProduct, Product } from "../models/product";

const PRODUCT_PARTITION_KEY_PREFIX = "PRODUCT#";
const PRODUCT_METADATA_SORT_KEY = "METADATA";
const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const fetchProductById = async (
  productId: string,
  tableName: string
): Promise<Product | null> => {
  const response = await dynamoDbClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `${PRODUCT_PARTITION_KEY_PREFIX}${productId}`,
        SK: PRODUCT_METADATA_SORT_KEY
      }
    })
  );

  const item = response.Item as unknown;

  if (!isProduct(item)) {
    return null;
  }

  return item;
};
