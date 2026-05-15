import {
  DynamoRecord,
  Product,
  ProductMetadataRecord,
  PurchaseRecord,
  QuizOptionRecord,
  QuizQuestionRecord,
  Session,
  SessionRecord,
  TopicRecord
} from "../types/productTypes";

export const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.price === "number" &&
    typeof candidate.shortDescription === "string" &&
    (candidate.level === "N5" || candidate.level === "N4" || candidate.level === "N3" || candidate.level === "N2" || candidate.level === "N1" || candidate.level === "JFT" || candidate.level === "Beginner") &&
    typeof candidate.topicsCount === "number" &&
    (candidate.featuredProducts === undefined || typeof candidate.featuredProducts === "boolean") &&
    typeof candidate.accessDurationDays === "number"
  );
};

export const isPurchaseRecord = (value: unknown): value is PurchaseRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.PK === "string" &&
    typeof candidate.SK === "string" &&
    candidate.entityType === "PURCHASE" &&
    typeof candidate.userId === "string" &&
    typeof candidate.productId === "string" &&
    typeof candidate.purchaseDate === "string" &&
    typeof candidate.expiryDate === "string"
  );
};

export const isQuizOptionRecord = (value: unknown): value is QuizOptionRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.id === undefined || typeof candidate.id === "string") &&
    typeof candidate.text === "string"
  );
};

export const isQuizQuestionRecord = (value: unknown): value is QuizQuestionRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.text === "string" &&
    Array.isArray(candidate.options) &&
    candidate.options.every(isQuizOptionRecord) &&
    (candidate.image === undefined || typeof candidate.image === "string") &&
    (candidate.audio === undefined || typeof candidate.audio === "string")
  );
};

export const isSessionType = (value: unknown): value is Session["type"] => {
  return value === "quiz"
    || value === "pdf"
    || value === "audio"
    || value === "images"
    || value === "video";
};

export const isProductMetadataRecord = (
  value: unknown,
  productPartitionKeyPrefix = "PRODUCT#",
  productMetadataSortKey = "METADATA"
): value is ProductMetadataRecord => {
  if (!isProduct(value) || !value || typeof value !== "object") {
    return false;
  }

  const candidate = value as unknown as DynamoRecord;

  return (
    typeof candidate.PK === "string"
    && candidate.PK.startsWith(productPartitionKeyPrefix)
    && candidate.SK === productMetadataSortKey
    && candidate.entityType === "PRODUCT"
    && typeof candidate.description === "string"
  );
};

export const isTopicRecord = (
  value: unknown,
  topicSortKeyPrefix = "TOPIC#"
): value is TopicRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as DynamoRecord;

  return (
    typeof candidate.PK === "string"
    && typeof candidate.SK === "string"
    && candidate.SK.startsWith(topicSortKeyPrefix)
    && candidate.entityType === "TOPIC"
    && typeof candidate.productId === "string"
    && typeof candidate.topicPartitionKey === "string"
    && typeof candidate.topicOrder === "number"
    && typeof candidate.id === "string"
    && typeof candidate.title === "string"
  );
};

export const isSessionRecord = (
  value: unknown,
  sessionSortKeyPrefix = "SESSION#"
): value is SessionRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as DynamoRecord;

  return (
    typeof candidate.PK === "string"
    && typeof candidate.SK === "string"
    && candidate.SK.startsWith(sessionSortKeyPrefix)
    && candidate.entityType === "SESSION"
    && typeof candidate.productId === "string"
    && typeof candidate.topicId === "string"
    && typeof candidate.sessionOrder === "number"
    && typeof candidate.id === "string"
    && typeof candidate.title === "string"
    && isSessionType(candidate.type)
    && (candidate.contentUrl === undefined || typeof candidate.contentUrl === "string")
  );
};
