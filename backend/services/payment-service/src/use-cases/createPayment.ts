import { AuthenticatedUser } from "@shared-utils/auth";
import { createLogger } from "@shared-utils/logger";
import { PaymentServiceEnv } from "../config/env";
import { generatePaymentOrderId } from "../domain/payment/generatePaymentOrderId";
import {
	ConflictError,
	ExternalServiceError,
	NotFoundError,
	ValidationError
} from "../errors/applicationErrors";
import { PaymentOrderRecord } from "../models/payment";
import { hasActiveProductAccess, savePaymentOrder } from "../repositories/paymentOrderRepository";
import { findProductById } from "../repositories/productRepository";
import { buildSnapPayload } from "../services/midtrans/buildSnapPayload";
import { createSnapTransaction } from "../services/midtransService";

const logger = createLogger("payment-service");

export interface CreatePaymentInput {
	env: PaymentServiceEnv;
	authenticatedUser: AuthenticatedUser;
	productId: string;
}

export interface CreatePaymentResult {
	orderId: string;
	snapToken: string;
	redirectUrl: string | null;
}

export const createPayment = async (
	input: CreatePaymentInput
): Promise<CreatePaymentResult> => {
	try {
		const hasActiveAccess = await hasActiveProductAccess(
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
		product = await findProductById(input.productId);
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
		appBaseUrl: input.env.APP_BASE_URL
	});

	let snapData;

	try {
		snapData = await createSnapTransaction({
			serverKey: input.env.MIDTRANS_SERVER_KEY,
			snapApiUrl: input.env.MIDTRANS_SNAP_API_URL,
			payload: snapPayload
		});
	} catch (error) {
		logger.error("payment.midtrans.snap.create.failed", {
			orderId,
			userId: input.authenticatedUser.id,
			productId: input.productId,
			snapApiUrl: input.env.MIDTRANS_SNAP_API_URL,
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
		productLevel: product.level,
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
		await savePaymentOrder(input.env.DYNAMO_DB_TABLE_NAME, paymentOrder);
	} catch {
		throw new ExternalServiceError("Failed to persist payment order");
	}

	return {
		orderId,
		snapToken: snapData.token,
		redirectUrl: paymentOrder.snapRedirectUrl
	};
};