import { createLogger } from "@shared-utils/logger";
import {
  createInternalApiClient,
  InternalApiClientError
} from "@shared-utils/internalApiClient";
import { getLearningServiceEnv } from "../config/env";
import { SessionRecord } from "../types/learningTypes";

const logger = createLogger("learning-service");

export interface OwnedProductSummary {
  id: string;
  productId: string;
  userId: string;
  level: string;
  name: string;
  purchaseDate: string;
  expiryDate: string;
}

export const getOwnedProductsByUserIdInternal = async (
  userId: string
): Promise<OwnedProductSummary[]> => {
  const env = getLearningServiceEnv();
  const internalApiClient = createInternalApiClient({
    baseUrl: env.PAYMENT_SERVICE_INTERNAL_API_BASE_URL,
    apiKey: env.PAYMENT_SERVICE_INTERNAL_SERVICE_API_KEY,
    timeoutMs: 2000
  });

  try {
    return await internalApiClient.get<OwnedProductSummary[]>(
      `/api/internal/payments/owned/${encodeURIComponent(userId)}`
    );
  } catch (error) {
    if (error instanceof InternalApiClientError) {
      logger.error("payment-service.internal.owned-products.failed", {
        userId,
        statusCode: error.statusCode,
        errorCode: error.code,
        errorMessage: error.message
      });
    } else {
      logger.error("payment-service.internal.owned-products.failed", {
        userId,
        error
      });
    }

    throw error;
  }
};

export const getSessionByIdInternal = async (
  productId: string,
  topicId: string,
  sessionId: string
): Promise<SessionRecord | null> => {
  const env = getLearningServiceEnv();
  const internalApiClient = createInternalApiClient({
    baseUrl: env.PRODUCT_SERVICE_INTERNAL_API_BASE_URL,
    apiKey: env.PRODUCT_SERVICE_INTERNAL_SERVICE_API_KEY,
    timeoutMs: 2000
  });

  try {
    return await internalApiClient.get<SessionRecord | null>(
      `/api/internal/products/${encodeURIComponent(productId)}/topics/${encodeURIComponent(topicId)}/sessions/${encodeURIComponent(sessionId)}`
    );
  } catch (error) {
    if (error instanceof InternalApiClientError && error.statusCode === 404) {
      return null;
    }

    if (error instanceof InternalApiClientError) {
      logger.error("product-service.internal.session.failed", {
        productId,
        topicId,
        sessionId,
        statusCode: error.statusCode,
        errorCode: error.code,
        errorMessage: error.message
      });
    } else {
      logger.error("product-service.internal.session.failed", {
        productId,
        topicId,
        sessionId,
        error
      });
    }

    throw error;
  }
};
