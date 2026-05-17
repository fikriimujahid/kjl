import { selectItems } from "@shared-dynamodb/selectItems";
import { createLogger } from "@shared-utils/logger";
import {
  ProductDetail,
  ProductMetadataRecord,
  Session,
  SessionRecord,
  Topic,
  TopicRecord
} from "../types/productTypes";
import {
  PRODUCT_METADATA_SORT_KEY,
  PRODUCT_PARTITION_KEY_PREFIX,
  SESSION_SORT_KEY_PREFIX,
  TOPIC_SORT_KEY_PREFIX
} from "./product.constants";
import { getProductServiceEnv } from "../config/env";
import { createDynamoDocumentClient } from "@shared-dynamodb/client";

const logger = createLogger("product-service");

type ProductMetadataRow = ProductMetadataRecord & Record<string, unknown>;
type SessionRow = SessionRecord & Record<string, unknown>;
type TopicRow = TopicRecord & Record<string, unknown>;

type ProductDetailRow = ProductMetadataRow | SessionRow | TopicRow;

export const findProductDetailsById = async (
  id: string
): Promise<ProductDetail | null> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getProductServiceEnv().DYNAMO_DB_TABLE_NAME;
  const productPartitionKey = `${PRODUCT_PARTITION_KEY_PREFIX}${id}`;
  const logContext = {
    id,
    tableName,
    productPartitionKey,
    metadataSortKey: PRODUCT_METADATA_SORT_KEY,
    topicSortKeyPrefix: TOPIC_SORT_KEY_PREFIX,
    sessionSortKeyPrefix: SESSION_SORT_KEY_PREFIX
  };

  try {
    const response = await selectItems<ProductDetailRow>(dynamoDbDocumentClient, {
      from: tableName,
      keyWhere: {
        PK: productPartitionKey
      }
    });
    const items = response.items;

    const metadataRecord = items.find(
      (item): item is ProductMetadataRow =>
        item.entityType === "PRODUCT"
        && item.SK === PRODUCT_METADATA_SORT_KEY
    );

    if (!metadataRecord) {
      return null;
    }

    const sessionRecords = items
      .filter(
        (item): item is SessionRow =>
          item.entityType === "SESSION"
          && item.SK.startsWith(SESSION_SORT_KEY_PREFIX)
      )
      .sort((a, b) => a.sessionOrder - b.sessionOrder);

    const sessionsByTopicId = new Map<string, Session[]>();

    for (const sessionRecord of sessionRecords) {
      const mappedSession: Session = {
        id: sessionRecord.id,
        title: sessionRecord.title,
        type: sessionRecord.type
      };

      const currentSessions = sessionsByTopicId.get(sessionRecord.topicId) ?? [];
      currentSessions.push(mappedSession);
      sessionsByTopicId.set(sessionRecord.topicId, currentSessions);
    }

    const topicRecords = items
      .filter(
        (item): item is TopicRow =>
          item.entityType === "TOPIC"
          && item.SK.startsWith(TOPIC_SORT_KEY_PREFIX)
      )
      .sort((a, b) => a.topicOrder - b.topicOrder);

    const topics: Topic[] = topicRecords.map((topicRecord) => ({
      id: topicRecord.id,
      title: topicRecord.title,
      sessions: sessionsByTopicId.get(topicRecord.id) ?? []
    }));

    return {
      id: metadataRecord.id,
      name: metadataRecord.name,
      price: metadataRecord.price,
      shortDescription: metadataRecord.shortDescription,
      level: metadataRecord.level,
      topicsCount: metadataRecord.topicsCount,
      featuredProducts: metadataRecord.featuredProducts,
      accessDurationDays: metadataRecord.accessDurationDays,
      description: metadataRecord.description,
      topics
    };
  } catch (error) {
    logger.error("dynamodb.findProductById.failure", {
      ...logContext,
      error
    });
    throw error;
  }
};