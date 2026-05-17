import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { getPaymentServiceEnv } from "../config/env";
import { mapPaymentErrorToResponse } from "../errors/errorToResponse";
import { createSuccessResponse } from "@shared-utils/response";
import { ValidationError, UnauthorizedError } from "../errors/applicationErrors";
import { createPaymentSchema } from "../schemas/createPaymentSchema";
import { createPayment } from "../use-cases/createPayment";

export const createPaymentHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const env = getPaymentServiceEnv();

    const authenticatedUser = getAuthenticatedUser(event);
    if (!authenticatedUser) {
      throw new UnauthorizedError("Unauthorized");
    }

    const parsedPayload = createPaymentSchema.safeParseEvent(event);

    if (!parsedPayload.success) {
      throw new ValidationError(parsedPayload.error);
    }
    
    const result = await createPayment({
      authenticatedUser,
      productId: parsedPayload.data.productId
    });

    return createSuccessResponse(event, 200, {
      orderId: result.orderId,
      snapToken: result.snapToken,
      redirectUrl: result.redirectUrl
    });
  } catch (error) {
    return mapPaymentErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to create payment",
      code: "PAYMENT_CREATE_FAILED"
    });
  }
};
