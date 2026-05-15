import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getWebhookEnv } from "../config/env";
import { mapErrorToResponse } from "../errors/errorToResponse";
import { ValidationError } from "../errors/applicationErrors";
import { handleWebhookUseCase } from "../use-cases/handleWebhookUseCase";
import { parseEventBody } from "../utils/request";
import { createSuccessResponse } from "@shared-utils/response";

export const handleWebhook = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const env = getWebhookEnv();

    let payload: Record<string, unknown>;

    try {
      payload = parseEventBody(event);
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    const result = await handleWebhookUseCase({
      env,
      payload
    });

    return createSuccessResponse(event, 200, {
      message: "Webhook processed",
      orderId: result.orderId,
      status: result.status
    });
  } catch (error) {
    const mappedErrorResponse = mapErrorToResponse(event, error);

    if (mappedErrorResponse) {
      return mappedErrorResponse;
    }

    throw error;
  }
};
