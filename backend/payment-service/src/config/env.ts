import { ValidationError } from "../errors/applicationErrors";

export interface CreatePaymentEnv {
  dynamoDbTableName: string;
  midtransServerKey: string;
  midtransSnapApiUrl: string;
  appBaseUrl: string;
}

export interface WebhookEnv {
  dynamoDbTableName: string;
  midtransServerKey: string;
}

const readSharedRequiredEnv = (): { dynamoDbTableName: string; midtransServerKey: string } => {
  const dynamoDbTableName = process.env.DYNAMO_DB_TABLE_NAME;
  const midtransServerKey = process.env.MIDTRANS_SERVER_KEY;

  if (!dynamoDbTableName) {
    throw new ValidationError("Missing DYNAMO_DB_TABLE_NAME environment variable", 500);
  }

  if (!midtransServerKey) {
    throw new ValidationError("Missing MIDTRANS_SERVER_KEY environment variable", 500);
  }

  return {
    dynamoDbTableName,
    midtransServerKey
  };
};

export const getCreatePaymentEnv = (): CreatePaymentEnv => {
  const { dynamoDbTableName, midtransServerKey } = readSharedRequiredEnv();
  const midtransSnapApiUrl = process.env.MIDTRANS_SNAP_API_URL;

  if (!midtransSnapApiUrl) {
    throw new ValidationError("Missing MIDTRANS_SNAP_API_URL environment variable", 500);
  }

  return {
    dynamoDbTableName,
    midtransServerKey,
    midtransSnapApiUrl,
    appBaseUrl: (process.env.APP_BASE_URL ?? "").trim().replace(/\/$/, "")
  };
};

export const getWebhookEnv = (): WebhookEnv => {
  const { dynamoDbTableName, midtransServerKey } = readSharedRequiredEnv();

  return {
    dynamoDbTableName,
    midtransServerKey
  };
};