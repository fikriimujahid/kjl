import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Product, ProductSummary, PurchasedProduct } from "../models/product";

const PRODUCT_DATA_URL = "https://kjl.fikri.dev/public-data/product.json";
const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;
const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

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
