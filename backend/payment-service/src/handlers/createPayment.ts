import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getCreatePaymentEnv } from "../config/env";
import { mapErrorToResponse } from "../errors/errorToResponse";
import { getAuthenticatedUser } from "../utils/auth";
import { parseEventBody } from "../utils/request";
import { jsonResponse } from "../utils/response";
import { ValidationError, UnauthorizedError } from "../errors/applicationErrors";
import { createPaymentSchema } from "../schemas/createPaymentSchema";
import { createPaymentUseCase } from "../use-cases/createPaymentUseCase";

export const createPayment = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const env = getCreatePaymentEnv();
    const authenticatedUser = getAuthenticatedUser(event);

    if (!authenticatedUser) {
      throw new UnauthorizedError("Unauthorized");
    }

    let payload: Record<string, unknown>;

    try {
      payload = parseEventBody(event);
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    const parsedPayload = createPaymentSchema.safeParse(payload);

    if (!parsedPayload.success) {
      throw new ValidationError("Missing productId");
    }

    const result = await createPaymentUseCase({
      env,
      authenticatedUser,
      productId: parsedPayload.data.productId
    });

    return jsonResponse(200, {
      orderId: result.orderId,
      snapToken: result.snapToken,
      redirectUrl: result.redirectUrl
    });
  } catch (error) {
    const mappedErrorResponse = mapErrorToResponse(error);

    if (mappedErrorResponse) {
      return mappedErrorResponse;
    }

    throw error;
  }
};
