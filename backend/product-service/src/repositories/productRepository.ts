import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbDocumentClient } from "../clients/awsClients";
import { Product, ProductDetail, Session, Topic } from "../types/productTypes";
import {
  isProduct,
  isProductMetadataRecord,
  isSessionRecord,
  isTopicRecord
} from "../utils/validators";
import { logProductServiceError } from "../utils/logger";

const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;
const PRODUCT_PARTITION_KEY_PREFIX = "PRODUCT#";
const TOPIC_SORT_KEY_PREFIX = "TOPIC#";
const SESSION_SORT_KEY_PREFIX = "SESSION#";
const PRODUCT_METADATA_SORT_KEY = "METADATA";

const getTableName = (): string => {
  if (!DYNAMO_DB_TABLE_NAME) {
    throw new Error("Missing DYNAMO_DB_TABLE_NAME environment variable");
  }

  return DYNAMO_DB_TABLE_NAME;
};

export const fetchProducts = async (): Promise<Product[]> => {
  const tableName = getTableName();
  const logContext = {
    tableName,
    entityType: "PRODUCT",
    metadataSortKey: PRODUCT_METADATA_SORT_KEY
  };

  try {
    const products: Product[] = [];
    let lastEvaluatedKey: Record<string, unknown> | undefined;

    do {
      const response = await dynamoDbDocumentClient.send(
        new ScanCommand({
          TableName: tableName,
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
            ":metadataSortKey": PRODUCT_METADATA_SORT_KEY
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

export const findProductDetailsById = async (id: string): Promise<ProductDetail | null> => {
  const tableName = getTableName();
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
    const response = await dynamoDbDocumentClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "#pk = :pk",
        ExpressionAttributeNames: {
          "#pk": "PK"
        },
        ExpressionAttributeValues: {
          ":pk": productPartitionKey
        }
      })
    );

    const metadataRecord = (response.Items ?? []).find((item) =>
      isProductMetadataRecord(item, PRODUCT_PARTITION_KEY_PREFIX, PRODUCT_METADATA_SORT_KEY)
    );

    if (!metadataRecord) {
      return null;
    }

    const sessionRecords = (response.Items ?? [])
      .filter((item) => isSessionRecord(item, SESSION_SORT_KEY_PREFIX))
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

    const topicRecords = (response.Items ?? [])
      .filter((item) => isTopicRecord(item, TOPIC_SORT_KEY_PREFIX))
      .sort((a, b) => a.topicOrder - b.topicOrder);

    const topics: Topic[] = topicRecords.map((topicRecord) => ({
      id: topicRecord.id,
      title: topicRecord.title,
      sessions: sessionsByTopicId.get(topicRecord.id) ?? []
    }));

    const productDetail: ProductDetail = {
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

    return productDetail;
  } catch (error) {
    logProductServiceError("dynamodb.findProductById.failure", logContext, error);
    throw error;
  }
};
