import { createLogger } from "@shared-utils/logger";
import {
  createInternalApiClient,
  InternalApiClientError
} from "@shared-utils/internalApiClient";
import { getPaymentServiceEnv } from "../config/env";

const logger = createLogger("payment-service");

export interface OwnedProductSummary {
  id: string;
  productId: string;
  userId: string;
  level: string;
  name: string;
  purchaseDate: string;
  expiryDate: string;
}

export const getOwnedProductsByUserId = async (
  userId: string
): Promise<OwnedProductSummary[]> => {
  const env = getPaymentServiceEnv();
  const internalApiClient = createInternalApiClient({
    baseUrl: env.PRODUCT_SERVICE_INTERNAL_API_BASE_URL,
    apiKey: env.INTERNAL_SERVICE_API_KEY,
    timeoutMs: 2000
  });

  try {
    return await internalApiClient.get<OwnedProductSummary[]>(
      `/api/internal/products/owned/${encodeURIComponent(userId)}`
    );
  } catch (error) {
    if (error instanceof InternalApiClientError) {
      logger.error("product-service.internal.owned-products.failed", {
        userId,
        statusCode: error.statusCode,
        errorCode: error.code,
        errorMessage: error.message
      });
    } else {
      logger.error("product-service.internal.owned-products.failed", {
        userId,
        error
      });
    }

    throw error;
  }
};
