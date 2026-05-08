import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { PurchaseRecord, PurchasedProduct } from "../types/productTypes";
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

const createPurchaseLogContext = (
  userId: string,
  productId: string,
  topicId: string,
  sessionId: string,
  tableName: string
) => {
  return {
    userId,
    productId,
    topicId,
    sessionId,
    tableName,
    purchasePartitionKey: `USER#${userId}`,
    purchaseSortKey: `PURCHASE#${productId}`
  };
};

export const getUserPurchase = async (
  userId: string,
  productId: string,
  topicId: string,
  sessionId: string
): Promise<PurchaseRecord | null> => {
  const tableName = getTableName();
  const logContext = createPurchaseLogContext(userId, productId, topicId, sessionId, tableName);

  logProductServiceInfo("dynamodb.getPurchase.start", logContext);

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

    logProductServiceInfo("dynamodb.getPurchase.success", {
      ...logContext,
      itemCount: response.Items?.length ?? 0
    });

    const purchase = (response.Items ?? []).find(isPurchaseRecord);

    if (!purchase) {
      logProductServiceInfo("dynamodb.getPurchase.notFound", logContext);
      return null;
    }

    return purchase;
  } catch (error) {
    logProductServiceError("dynamodb.getPurchase.failure", logContext, error);
    throw error;
  }
};

export const listPurchasedProducts = async (
  userId: string
): Promise<PurchasedProduct[]> => {
  const tableName = getTableName();
  const logContext = {
    userId,
    tableName,
    purchasePartitionKey: `USER#${userId}`,
    purchaseSortKeyPrefix: "PURCHASE#"
  };

  logProductServiceInfo("dynamodb.listPurchases.start", logContext);

  try {
    const response = await dynamoDbDocumentClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :skPrefix)",
        ExpressionAttributeNames: {
          "#pk": "PK",
          "#sk": "SK"
        },
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":skPrefix": "PURCHASE#"
        }
      })
    );

    const purchasedProducts = (response.Items ?? [])
      .filter(isPurchaseRecord)
      .map(mapPurchaseRecordToPurchasedProduct);

    logProductServiceInfo("dynamodb.listPurchases.success", {
      ...logContext,
      itemCount: response.Items?.length ?? 0,
      purchaseCount: purchasedProducts.length
    });

    return purchasedProducts;
  } catch (error) {
    logProductServiceError("dynamodb.listPurchases.failure", logContext, error);
    throw error;
  }
};
