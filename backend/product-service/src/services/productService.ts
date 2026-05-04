import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Product, ProductSummary, PurchasedProduct, Session, SessionDetail, Topic } from "../models/product";

const PRODUCT_DATA_URL = "https://kjl.fikri.dev/public-data/product.json";
const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;
const MEDIA_PRIVATE_BUCKET_NAME = process.env.MEDIA_PRIVATE_BUCKET_NAME;
const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3Client = new S3Client({});
const SIGNED_URL_TTL_SECONDS = 3600;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);

interface PurchaseRecord {
  PK: string;
  SK: string;
  entityType: "PURCHASE";
  userId: string;
  productId: string;
  purchaseId?: string;
  purchaseDate: string;
  expiryDate: string;
}

const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.price === "number" &&
    typeof candidate.description === "string"
  );
};

const isPurchaseRecord = (value: unknown): value is PurchaseRecord => {
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

const mapPurchaseRecord = (record: PurchaseRecord): PurchasedProduct => {
  const derivedId = record.SK.startsWith("PURCHASE#")
    ? record.SK.slice("PURCHASE#".length)
    : record.SK;

  return {
    id: record.purchaseId ?? derivedId,
    productId: record.productId,
    userId: record.userId,
    purchaseDate: record.purchaseDate,
    accessExpiryDate: record.expiryDate
  };
};

const parseDateValue = (value: string): number => {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return Number.NaN;
  }

  return parsed;
};

const isPurchaseActive = (purchase: PurchaseRecord): boolean => {
  const expiryTime = parseDateValue(purchase.expiryDate);

  if (Number.isNaN(expiryTime)) {
    return false;
  }

  return expiryTime > Date.now();
};

const getFileExtension = (key: string): string => {
  const lastDotIndex = key.lastIndexOf(".");
  return lastDotIndex >= 0 ? key.slice(lastDotIndex).toLowerCase() : "";
};

const getObjectIdFromKey = (key: string): string => {
  const segments = key.split("/");
  return segments[segments.length - 1] ?? key;
};

const buildSignedObjectUrl = async (key: string): Promise<string> => {
  if (!MEDIA_PRIVATE_BUCKET_NAME) {
    throw new Error("Missing MEDIA_PRIVATE_BUCKET_NAME environment variable");
  }

  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: MEDIA_PRIVATE_BUCKET_NAME,
      Key: key
    }),
    { expiresIn: SIGNED_URL_TTL_SECONDS }
  );
};

const listSessionObjectKeys = async (prefix: string): Promise<string[]> => {
  if (!MEDIA_PRIVATE_BUCKET_NAME) {
    throw new Error("Missing MEDIA_PRIVATE_BUCKET_NAME environment variable");
  }

  const objectKeys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: MEDIA_PRIVATE_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken
      })
    );

    for (const item of response.Contents ?? []) {
      if (item.Key && !item.Key.endsWith("/")) {
        objectKeys.push(item.Key);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objectKeys.sort((left, right) => left.localeCompare(right));
};

const resolveTopicAndSession = (
  product: Product,
  topicId: string,
  sessionId: string
): { topic: Topic; session: Session } | null => {
  const topic = product.topics.find((item) => item.id === topicId);

  if (!topic) {
    return null;
  }

  const session = topic.sessions.find((item) => item.id === sessionId);

  if (!session) {
    return null;
  }

  return { topic, session };
};

const buildQuizPlaceholder = (session: Session): SessionDetail[] => {
  return [
    {
      id: `${session.id}-placeholder-1`,
      text: `Placeholder quiz for ${session.title}`,
      options: ["Option A", "Option B", "Option C", "Option D"]
    }
  ];
};

const buildSessionDetailsFromMedia = async (
  session: Session,
  objectKeys: string[]
): Promise<SessionDetail[]> => {
  if (session.type === "quiz") {
    return buildQuizPlaceholder(session);
  }

  if (objectKeys.length === 0) {
    return [];
  }

  if (session.type === "images") {
    const imageKeys = objectKeys.filter((key) => IMAGE_EXTENSIONS.has(getFileExtension(key)));

    return Promise.all(
      imageKeys.map(async (key) => ({
        id: getObjectIdFromKey(key),
        contentUrl: await buildSignedObjectUrl(key)
      }))
    );
  }

  const primaryKey = objectKeys[0];
  const primaryExtension = getFileExtension(primaryKey);

  return [
    {
      id: getObjectIdFromKey(primaryKey),
      contentUrl: await buildSignedObjectUrl(primaryKey),
      audio: AUDIO_EXTENSIONS.has(primaryExtension) ? await buildSignedObjectUrl(primaryKey) : undefined
    }
  ];
};

const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch(PRODUCT_DATA_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch product data: ${response.status}`);
  }

  const payload: unknown = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error("Invalid product payload format");
  }

  return payload.filter(isProduct);
};

export const listProducts = async (): Promise<ProductSummary[]> => {
  const products = await fetchProducts();
  return products.map(({ id, name, price }) => ({ id, name, price }));
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const products = await fetchProducts();
  const product = products.find((item) => item.id === id);
  return product ?? null;
};

export const getProductSessionDetails = async (
  userId: string,
  productId: string,
  topicId: string,
  sessionId: string
): Promise<SessionDetail[] | null> => {
  if (!DYNAMO_DB_TABLE_NAME) {
    throw new Error("Missing DYNAMO_DB_TABLE_NAME environment variable");
  }

  const product = await getProductById(productId);

  if (!product) {
    return null;
  }

  const resolvedSession = resolveTopicAndSession(product, topicId, sessionId);

  if (!resolvedSession) {
    return null;
  }

  const purchaseResponse = await dynamoDbClient.send(
    new QueryCommand({
      TableName: DYNAMO_DB_TABLE_NAME,
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

  const purchase = (purchaseResponse.Items ?? []).find(isPurchaseRecord);

  if (!purchase || !isPurchaseActive(purchase)) {
    return null;
  }

  const prefix = `products/${productId}/${topicId}/${sessionId}`;
  const objectKeys = await listSessionObjectKeys(prefix);

  return buildSessionDetailsFromMedia(resolvedSession.session, objectKeys);
};

export const listPurchasedProductsByUser = async (
  userId: string
): Promise<PurchasedProduct[]> => {
  if (!DYNAMO_DB_TABLE_NAME) {
    throw new Error("Missing DYNAMO_DB_TABLE_NAME environment variable");
  }

  const response = await dynamoDbClient.send(
    new QueryCommand({
      TableName: DYNAMO_DB_TABLE_NAME,
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

  return (response.Items ?? []).filter(isPurchaseRecord).map(mapPurchaseRecord);
};
