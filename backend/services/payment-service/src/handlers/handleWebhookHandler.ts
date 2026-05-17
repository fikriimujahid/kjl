import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createSuccessResponse } from "@shared-utils/response";
import { getPaymentServiceEnv } from "../config/env";
import { ValidationError } from "../errors/applicationErrors";
import { mapPaymentErrorToResponse } from "../errors/errorToResponse";
import { handleWebhook } from "../use-cases/handleWebhook";
import { parseEventBody } from "../utils/request";

export const handleWebhookHandler = async (
	event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
	try {
		const env = getPaymentServiceEnv();

		let payload: Record<string, unknown>;

		try {
			payload = parseEventBody(event);
		} catch {
			throw new ValidationError("Invalid JSON body");
		}

		const result = await handleWebhook({
			env,
			payload
		});

		return createSuccessResponse(event, 200, {
			message: "Webhook processed",
			orderId: result.orderId,
			status: result.status
		});
	} catch (error) {
		return mapPaymentErrorToResponse(event, error, {
			statusCode: 502,
			message: "Failed to process payment webhook",
			code: "PAYMENT_WEBHOOK_FAILED"
		});
	}
};