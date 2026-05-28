import { createLogger } from "@shared-utils/logger";
import {
  createInternalApiClient,
  InternalApiClientError
} from "@shared-utils/internalApiClient";
import { getPaymentServiceEnv } from "../config/env";

const logger = createLogger("payment-service");

export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  shortDescription: string;
  level: string;
  topicsCount: number;
  featuredProducts?: boolean;
  accessDurationDays: number;
}

export const getProductSummaryByIdInternal = async (
  productId: string
): Promise<ProductSummary | null> => {
  const env = getPaymentServiceEnv();
  const internalApiClient = createInternalApiClient({
    baseUrl: env.PRODUCT_SERVICE_INTERNAL_API_BASE_URL,
    apiKey: env.PRODUCT_SERVICE_INTERNAL_SERVICE_API_KEY,
    timeoutMs: 2000
  });

  try {
    return await internalApiClient.get<ProductSummary | null>(
      `/api/internal/products/${encodeURIComponent(productId)}/summary`
    );
  } catch (error) {
    if (error instanceof InternalApiClientError && error.statusCode === 404) {
      return null;
    }

    if (error instanceof InternalApiClientError) {
      logger.error("product-service.public.product-detail.failed", {
        productId,
        statusCode: error.statusCode,
        errorCode: error.code,
        errorMessage: error.message
      });
    } else {
      logger.error("product-service.public.product-detail.failed", {
        productId,
        error
      });
    }

    throw error;
  }
};