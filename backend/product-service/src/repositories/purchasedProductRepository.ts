import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { PurchasedProduct } from "../types/productTypes";
import { mapPurchaseRecordToPurchasedProduct } from "../mappers/purchaseMapper";
import { logProductServiceError, logProductServiceInfo } from "../utils/logger";
import { isPurchaseRecord } from "../utils/validators";
import { dynamoDbDocumentClient } from "../clients/awsClients";

const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;

const getTableName = (): string => {
  if (!DYNAMO_DB_TABLE_NAME) {
    throw new Error("Missing DYNAMO_DB_TABLE_NAME environment variable");
  }

  return DYNAMO_DB_TABLE_NAME;
};

export const findPurchasedProductByUserAndProductId = async (
  userId: string,
  productId: string
): Promise<PurchasedProduct | null> => {
  const tableName = getTableName();
  const logContext = {
    userId,
    productId,
    tableName,
    purchasePartitionKey: `USER#${userId}`,
    purchaseSortKey: `PURCHASE#${productId}`
  };

  try {
    const response = await dynamoDbDocumentClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "#pk = :pk AND #sk = :sk",
        ExpressionAttributeNames: {
          "#pk": "PK",
          "#sk": "SK"
        },
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": `PURCHASE#${productId}`
        },
        Limit: 1
      })
    );

    const purchaseRecord = (response.Items ?? []).find(isPurchaseRecord);

    if (!purchaseRecord) {
      return null;
    }

    const purchasedProduct = mapPurchaseRecordToPurchasedProduct(purchaseRecord);

    return purchasedProduct;
  } catch (error) {
    logProductServiceError("dynamodb.findPurchasedProduct.failure", logContext, error);
    throw error;
  }
};