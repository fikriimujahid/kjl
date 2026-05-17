import { defineEnvSchema, InferEnv, validateEnv } from "@shared-utils/env";
import { ValidationError } from "../errors/applicationErrors";

const parseStringEnv = (rawValue: string): string => rawValue;
const parseAppBaseUrl = (rawValue: string): string => rawValue.trim().replace(/\/$/, "");
const parseUrlEnv = (rawValue: string): string => rawValue.trim().replace(/\/$/, "");

const paymentServiceEnvSchema = defineEnvSchema({
  DYNAMO_DB_TABLE_NAME: { required: true, parse: parseStringEnv },
  MIDTRANS_SERVER_KEY: { required: true, parse: parseStringEnv },
  MIDTRANS_SNAP_API_URL: { required: true, parse: parseStringEnv },
  APP_BASE_URL: { defaultValue: "", parse: parseAppBaseUrl },
  PRODUCT_SERVICE_INTERNAL_API_BASE_URL: { required: true, parse: parseUrlEnv },
  PRODUCT_SERVICE_INTERNAL_SERVICE_API_KEY: { required: true, parse: parseStringEnv }
});

export type PaymentServiceEnv = InferEnv<typeof paymentServiceEnvSchema>;

let cachedEnv: PaymentServiceEnv | null = null;

export const clearEnvCache = (): void => {
  cachedEnv = null;
};

const mapEnvValidationError = (error: unknown): never => {
  if (error instanceof Error) {
    const missingVariableMatch = error.message.match(/^Missing required environment variable: (.+)$/);

    if (missingVariableMatch) {
      throw new ValidationError(
        `Missing ${missingVariableMatch[1]} environment variable`,
        500
      );
    }

    throw new ValidationError(error.message, 500);
  }

  throw new ValidationError("Invalid payment-service environment", 500);
};

export const getPaymentServiceEnv = (): PaymentServiceEnv => {
  if (!cachedEnv) {
    try {
      cachedEnv = validateEnv(process.env, paymentServiceEnvSchema);
    } catch (error) {
      mapEnvValidationError(error);
    }
  }

  return cachedEnv as PaymentServiceEnv;
};
