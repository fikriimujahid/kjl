const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;

export const PRODUCT_ENTITY_TYPE = "PRODUCT";
export const PRODUCT_PARTITION_KEY_PREFIX = "PRODUCT#";
export const TOPIC_SORT_KEY_PREFIX = "TOPIC#";
export const SESSION_SORT_KEY_PREFIX = "SESSION#";
export const PRODUCT_METADATA_SORT_KEY = "METADATA";

export const getProductTableName = (): string => {
  if (!DYNAMO_DB_TABLE_NAME) {
    throw new Error("Missing DYNAMO_DB_TABLE_NAME environment variable");
  }

  return DYNAMO_DB_TABLE_NAME;
};
