import { defineEnvSchema, InferEnv, validateEnv } from "@shared-utils/env";

const parseStringEnv = (rawValue: string): string => rawValue;
const parseUrlEnv = (rawValue: string): string => rawValue.trim().replace(/\/$/, "");

const learningServiceEnvSchema = defineEnvSchema({
  DYNAMO_DB_TABLE_NAME: { required: true, parse: parseStringEnv },
  MEDIA_PRIVATE_BUCKET_NAME: { required: true, parse: parseStringEnv },
  PRODUCT_SERVICE_INTERNAL_API_BASE_URL: { required: true, parse: parseUrlEnv },
  PRODUCT_SERVICE_INTERNAL_SERVICE_API_KEY: { required: true, parse: parseStringEnv }
});

export type LearningServiceEnv = InferEnv<typeof learningServiceEnvSchema>;

let cachedEnv: LearningServiceEnv | null = null;

export const getLearningServiceEnv = (): LearningServiceEnv => {
  if (!cachedEnv) {
    cachedEnv = validateEnv(process.env, learningServiceEnvSchema);
  }

  return cachedEnv;
};
