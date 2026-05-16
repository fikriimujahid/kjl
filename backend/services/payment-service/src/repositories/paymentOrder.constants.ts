import { getPaymentServiceEnv } from "../config/env";

export const PRODUCT_ENTITY_TYPE = "PRODUCT";
export const PRODUCT_PARTITION_KEY_PREFIX = "PRODUCT#";
export const TOPIC_SORT_KEY_PREFIX = "TOPIC#";
export const SESSION_SORT_KEY_PREFIX = "SESSION#";
export const PRODUCT_METADATA_SORT_KEY = "METADATA";

export const getTableName = (): string => {
  return getPaymentServiceEnv().DYNAMO_DB_TABLE_NAME;
};
