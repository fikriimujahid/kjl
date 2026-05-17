import { defineEnvSchema, InferEnv, validateEnv } from "@shared-utils/env";

const parseStringEnv = (rawValue: string): string => rawValue;

const productServiceEnvSchema = defineEnvSchema({
  DYNAMO_DB_TABLE_NAME: { required: true, parse: parseStringEnv },
  MEDIA_PRIVATE_BUCKET_NAME: { required: true, parse: parseStringEnv },
  PRODUCT_SERVICE_INTERNAL_SERVICE_API_KEY: { required: true, parse: parseStringEnv }
});

export type ProductServiceEnv = InferEnv<typeof productServiceEnvSchema>;

let cachedEnv: ProductServiceEnv | null = null;

export const getProductServiceEnv = () => {
  if (!cachedEnv) {
    cachedEnv = validateEnv(process.env, productServiceEnvSchema);
  }

  return cachedEnv;
};