import { PaymentOrderRecord } from "../models/payment";
import { createLogger } from "@shared-utils/logger";
import { createSnapTransaction } from "../services/midtransService";
import { buildSnapPayload } from "../services/midtrans/buildSnapPayload";
import { hasActiveProductAccess, savePaymentOrder } from "../services/paymentRepository";
import { fetchProductById } from "../services/productService";
import { AuthenticatedUser } from "../utils/auth";
import {
  ConflictError,
  ExternalServiceError,
  NotFoundError,
  ValidationError
} from "../errors/applicationErrors";
import { CreatePaymentEnv } from "../config/env";
import { generatePaymentOrderId } from "../domain/payment/generatePaymentOrderId";

const logger = createLogger("payment-service");

interface CreatePaymentUseCaseInput {
  env: CreatePaymentEnv;
  authenticatedUser: AuthenticatedUser;
  productId: string;
}

interface CreatePaymentUseCaseResult {
  orderId: string;
  snapToken: string;
  redirectUrl: string | null;
}

export const createPaymentUseCase = async (
  input: CreatePaymentUseCaseInput
): Promise<CreatePaymentUseCaseResult> => {
  try {
    const hasActiveAccess = await hasActiveProductAccess(
      input.env.dynamoDbTableName,
      input.authenticatedUser.id,
      input.productId
    );

    if (hasActiveAccess) {
      throw new ConflictError("User already has the product");
    }
  } catch (error) {
    if (error instanceof ConflictError) {
      throw error;
    }

    throw new ExternalServiceError("Failed to validate existing product access");
  }

  let product;

  try {
    product = await fetchProductById(input.productId, input.env.dynamoDbTableName);
  } catch {
    throw new ExternalServiceError("Failed to load product data");
  }

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  const amount = Math.round(product.price);

  if (amount <= 0) {
    throw new ValidationError("Invalid product price");
  }

  const orderId = generatePaymentOrderId(input.authenticatedUser.id);

  if (orderId.length > 50) {
    throw new ValidationError("Unable to create valid order id for this user");
  }

  const snapPayload = buildSnapPayload({
    orderId,
    amount,
    product,
    authenticatedUser: input.authenticatedUser,
    appBaseUrl: input.env.appBaseUrl
  });

  let snapData;

  try {
    snapData = await createSnapTransaction({
      serverKey: input.env.midtransServerKey,
      snapApiUrl: input.env.midtransSnapApiUrl,
      payload: snapPayload
    });
  } catch (error) {
    logger.error("payment.midtrans.snap.create.failed", {
      orderId,
      userId: input.authenticatedUser.id,
      productId: input.productId,
      snapApiUrl: input.env.midtransSnapApiUrl,
      error: error instanceof Error ? error.message : String(error)
    });

    throw new ExternalServiceError("Midtrans rejected payment creation");
  }

  const now = new Date().toISOString();

  const paymentOrder: PaymentOrderRecord = { 
    PK: `PAYMENT#${input.authenticatedUser.id}`,
    SK: `PAYMENT#${orderId}`,
    entityType: "PAYMENT_ORDER",
    orderId,
    userId: input.authenticatedUser.id,
    productId: product.id,
    productName: product.name,
    amount,
    grossAmount: amount.toFixed(2),
    accessDurationDays: product.accessDurationDays,
    snapRedirectUrl: snapData.redirectUrl,
    status: "CREATED",
    paymentProvider: "MIDTRANS",
    createdAt: now,
    updatedAt: now
  };

  try {
    await savePaymentOrder(input.env.dynamoDbTableName, paymentOrder);
  } catch {
    throw new ExternalServiceError("Failed to persist payment order");
  }

  return {
    orderId,
    snapToken: snapData.token,
    redirectUrl: paymentOrder.snapRedirectUrl
  };
};