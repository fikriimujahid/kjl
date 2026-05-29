import { AuthenticatedUser } from "@shared-utils/auth";
import { createLogger } from "@shared-utils/logger";
import { generatePaymentOrderId } from "../domain/payment/generatePaymentOrderId";
import {
	ConflictError,
	ExternalServiceError,
	NotFoundError,
	ValidationError
} from "../errors/applicationErrors";
import { listOwnedProductsByUserId, grantProductAccess } from "../repositories/paymentOrderRepository";
import { PaymentOrderRecord } from "../models/payment";
import { getProductSummaryByIdInternal } from "../services/productServiceInternalClient";
import { savePaymentOrder } from "../repositories/paymentOrderRepository";
import { buildSnapPayload } from "../services/midtrans/buildSnapPayload";
import { createSnapTransaction } from "../services/midtransService";

const logger = createLogger("payment-service");

export interface CreatePaymentInput {
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
		const ownedProducts = await listOwnedProductsByUserId(input.authenticatedUser.id);
    const hasActiveAccess = ownedProducts.some((ownedProduct) => ownedProduct.productId === input.productId);

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
		product = await getProductSummaryByIdInternal(input.productId);
	} catch {
		throw new ExternalServiceError("Failed to load product data");
	}

	if (!product) {
		throw new NotFoundError("Product not found");
	}

	const amount = Math.round(product.price);

	if (amount < 0) {
		throw new ValidationError("Invalid product price");
	}

	const orderId = generatePaymentOrderId(input.authenticatedUser.id);

	if (orderId.length > 50) {
		throw new ValidationError("Unable to create valid order id for this user");
	}

	if (amount === 0) {
		const now = new Date().toISOString();

		const freeOrder: PaymentOrderRecord = {
			PK: `PAYMENT#${input.authenticatedUser.id}`,
			SK: `PAYMENT#${orderId}`,
			entityType: "PAYMENT_ORDER",
			orderId,
			userId: input.authenticatedUser.id,
			productId: product.id,
			name: product.name,
			level: product.level,
			amount: 0,
			grossAmount: "0.00",
			accessDurationDays: product.accessDurationDays,
			snapRedirectUrl: null,
			status: "SUCCESS",
			paymentProvider: "MIDTRANS",
			createdAt: now,
			updatedAt: now
		};

		let expiryDate: string;

		try {
			expiryDate = await grantProductAccess(freeOrder, now);
		} catch {
			throw new ExternalServiceError("Failed to grant product access");
		}

		freeOrder.accessGrantedAt = now;
		freeOrder.expiryDate = expiryDate;

		try {
			await savePaymentOrder(freeOrder);
		} catch {
			throw new ExternalServiceError("Failed to persist payment order");
		}

		return {
			orderId,
			snapToken: "",
			redirectUrl: null
		};
	}

	const snapPayload = buildSnapPayload({
		orderId,
		amount,
		product,
		authenticatedUser: input.authenticatedUser
	});

	let snapData;

	try {
		snapData = await createSnapTransaction({
			payload: snapPayload
		});
	} catch (error) {
		logger.error("payment.midtrans.snap.create.failed", {
			orderId,
			userId: input.authenticatedUser.id,
			productId: input.productId,
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
		name: product.name,
		level: product.level,
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
		await savePaymentOrder(paymentOrder);
	} catch {
		throw new ExternalServiceError("Failed to persist payment order");
	}

	return {
		orderId,
		snapToken: snapData.token,
		redirectUrl: paymentOrder.snapRedirectUrl
	};
};