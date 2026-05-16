import { PaymentServiceEnv } from "../config/env";
import {
	ExternalServiceError,
	NotFoundError,
	UnauthorizedError,
	ValidationError
} from "../errors/applicationErrors";
import { PaymentOrderRecord, PaymentStatus } from "../models/payment";
import { readOrderIdFromWebhookPayload } from "../schemas/handleWebhookSchema";
import {
	findPaymentOrderById,
	grantProductAccess,
	savePaymentOrder
} from "../repositories/paymentOrderRepository";
import { normalizePaymentStatus, validateWebhookSignature } from "../services/midtransService";

export interface HandleWebhookInput {
	env: PaymentServiceEnv;
	payload: Record<string, unknown>;
}

export interface HandleWebhookResult {
	orderId: string;
	status: PaymentStatus;
}

const readStringField = (payload: Record<string, unknown>, fieldName: string): string | null => {
	const value = payload[fieldName];
	return typeof value === "string" ? value : null;
};

export const handleWebhook = async (
	input: HandleWebhookInput
): Promise<HandleWebhookResult> => {
	if (!validateWebhookSignature(input.payload, input.env.MIDTRANS_SERVER_KEY)) {
		throw new UnauthorizedError("Invalid Midtrans signature");
	}

	const orderId = readOrderIdFromWebhookPayload(input.payload);

	if (!orderId) {
		throw new ValidationError("Missing order_id");
	}

	let existingOrder: PaymentOrderRecord | null;

	try {
		existingOrder = await findPaymentOrderById(input.env.DYNAMO_DB_TABLE_NAME, orderId);
	} catch {
		throw new ExternalServiceError("Failed to read payment order");
	}

	if (!existingOrder) {
		throw new NotFoundError("Payment order not found");
	}

	const transactionStatus = readStringField(input.payload, "transaction_status");
	const fraudStatus = readStringField(input.payload, "fraud_status");
	const normalizedStatus = normalizePaymentStatus(transactionStatus, fraudStatus);
	const now = new Date().toISOString();

	const updatedOrder: PaymentOrderRecord = {
		...existingOrder,
		status: normalizedStatus,
		transactionStatus: transactionStatus ?? undefined,
		statusCode: input.payload.status_code == null ? "" : String(input.payload.status_code),
		grossAmount: input.payload.gross_amount == null ? "" : String(input.payload.gross_amount),
		fraudStatus,
		paymentType: readStringField(input.payload, "payment_type"),
		transactionId: readStringField(input.payload, "transaction_id"),
		transactionTime: readStringField(input.payload, "transaction_time"),
		settlementTime: readStringField(input.payload, "settlement_time"),
		updatedAt: now
	};

	if (normalizedStatus === "SUCCESS" && !existingOrder.accessGrantedAt) {
		try {
			const expiryDate = await grantProductAccess(input.env.DYNAMO_DB_TABLE_NAME, existingOrder, now);
			updatedOrder.accessGrantedAt = now;
			updatedOrder.expiryDate = expiryDate;
		} catch {
			throw new ExternalServiceError("Failed to grant product access");
		}
	}

	try {
		await savePaymentOrder(input.env.DYNAMO_DB_TABLE_NAME, updatedOrder);
	} catch {
		throw new ExternalServiceError("Failed to update payment order");
	}

	return {
		orderId,
		status: normalizedStatus
	};
};