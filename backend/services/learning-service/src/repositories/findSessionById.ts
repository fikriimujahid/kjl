import { createDynamoDocumentClient } from "@shared-dynamodb/client";
import { selectItems } from "@shared-dynamodb/selectItems";
import { createLogger } from "@shared-utils/logger";
import { getLearningServiceEnv } from "../config/env";
import { SessionRecord } from "../types/learningTypes";

const logger = createLogger("learning-service");

export const findSessionById = async (
  productId: string,
  topicId: string,
  sessionId: string
): Promise<SessionRecord | null> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getLearningServiceEnv().DYNAMO_DB_TABLE_NAME;
  const productPartitionKey = `PRODUCT#${productId}`;
  const sessionSortKey = `SESSION#${topicId}#${sessionId}`;

  try {
    const response = await selectItems<SessionRecord & Record<string, unknown>>(dynamoDbDocumentClient, {
      from: tableName,
      keyWhere: {
        PK: productPartitionKey,
        SK: sessionSortKey
      }
    });

    const sessionRecord = response.items.find((item) => item.entityType === "SESSION");

    if (!sessionRecord) {
      return null;
    }

    return {
      PK: sessionRecord.PK,
      SK: sessionRecord.SK,
      entityType: "SESSION",
      productId: sessionRecord.productId,
      topicId: sessionRecord.topicId,
      sessionOrder: sessionRecord.sessionOrder,
      id: sessionRecord.id,
      title: sessionRecord.title,
      type: sessionRecord.type,
      contentUrl: sessionRecord.contentUrl
    };
  } catch (error) {
    logger.error("dynamodb.findSessionById.failure", {
      tableName,
      productPartitionKey,
      sessionSortKey,
      error
    });
    throw error;
  }
};
