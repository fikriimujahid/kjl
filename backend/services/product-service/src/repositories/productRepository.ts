import { scanItems } from "@shared-dynamodb/scanItems";
import { queryAllItems } from "@shared-dynamodb/queryAllItems";
import { dynamoDbDocumentClient } from "../clients/awsClients";
import { Product, OwnedProduct, ProductDetail, PurchaseRecord, Session, Topic } from "../types/productTypes";
import {
  isProductMetadataRecord,
  isPurchaseRecord,
  isSessionRecord,
  isTopicRecord
} from "../utils/validators";
import { isPurchaseActive } from "../utils/dateUtils";
import {
  PRODUCT_ENTITY_TYPE,
  PRODUCT_METADATA_SORT_KEY,
  PRODUCT_PARTITION_KEY_PREFIX,
  SESSION_SORT_KEY_PREFIX,
  TOPIC_SORT_KEY_PREFIX,
  getProductTableName
} from "./product.constants";
import { mapProductItem } from "./mapProductItem";

export const findProducts = async (): Promise<Product[]> => {
  const tableName = getProductTableName();
  const sharedDynamoClient =
    dynamoDbDocumentClient as unknown as Parameters<typeof scanItems>[0];
  const logContext = {
    tableName,
    entityType: PRODUCT_ENTITY_TYPE,
    metadataSortKey: PRODUCT_METADATA_SORT_KEY
  };

  try {
    const response = await scanItems(sharedDynamoClient, {
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
        ":productEntityType": PRODUCT_ENTITY_TYPE,
        ":metadataSortKey": PRODUCT_METADATA_SORT_KEY
      }
    });

    return response.items
      .map(mapProductItem)
      .filter((product): product is Product => Boolean(product));
  } catch (error) {
    console.log("[ERROR]", "dynamodb.listProducts.failure", {
      ...logContext,
      error
    });
    throw error;
  }
};


const mapPurchaseRecordToOwnedProduct = (record: PurchaseRecord): OwnedProduct => {
  const candidate = record as unknown as Record<string, unknown>;
  const derivedId = record.SK.startsWith("PURCHASE#")
    ? record.SK.slice("PURCHASE#".length)
    : record.SK;

  return {
    id: record.purchaseId ?? derivedId,
    productId: record.productId,
    userId: record.userId,
    level: typeof candidate.level === "string" ? candidate.level : "",
    name: typeof candidate.name === "string" ? candidate.name : "",
    purchaseDate: record.purchaseDate,
    accessExpiryDate: record.expiryDate
  };
};

export const findProductDetailsById = async (id: string): Promise<ProductDetail | null> => {
  const tableName = getProductTableName();
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
    const items = await queryAllItems<Record<string, unknown>>(dynamoDbDocumentClient, {
      TableName: tableName,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: {
        "#pk": "PK"
      },
      ExpressionAttributeValues: {
        ":pk": productPartitionKey
      }
    });

    const metadataRecord = items.find((item) =>
      isProductMetadataRecord(item, PRODUCT_PARTITION_KEY_PREFIX, PRODUCT_METADATA_SORT_KEY)
    );

    if (!metadataRecord) {
      return null;
    }

    const sessionRecords = items
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

    const topicRecords = items
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
    console.log("[ERROR]", "dynamodb.findProductById.failure", {
      ...logContext,
      error
    });
    throw error;
  }
};

export const findOwnedProducts = async ( 
  userId: string
): Promise<OwnedProduct[]> => {
  const tableName = getProductTableName();
  const logContext = {
    userId,
    tableName,
    purchasePartitionKey: `OWNED_PRODUCT#${userId}`,
    purchaseSortKeyPrefix: "PURCHASE#"
  };

  try {
    const items = await queryAllItems<Record<string, unknown>>(dynamoDbDocumentClient, {
      TableName: tableName,
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :skPrefix)",
      ExpressionAttributeNames: {
        "#pk": "PK",
        "#sk": "SK"
      },
      ExpressionAttributeValues: {
        ":pk": `OWNED_PRODUCT#${userId}`,
        ":skPrefix": "PURCHASE#"
      }
    });

    const activeOwnedRecords: PurchaseRecord[] = [];

    for (const item of items) {
      if (isPurchaseRecord(item) && isPurchaseActive(item)) {
        activeOwnedRecords.push(item);
      }
    } 

    const ownedProducts = activeOwnedRecords.map(mapPurchaseRecordToOwnedProduct);

    return ownedProducts;
  } catch (error) {
    console.log("[ERROR]", "dynamodb.listPurchases.failure", {
      ...logContext,
      error
    });
    throw error;
  }
};