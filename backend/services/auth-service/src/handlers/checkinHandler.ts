import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getAuthenticatedUserId } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapAuthErrorToResponse } from "../errors/errorToResponse";
import { checkinSchema } from "../schemas/checkinSchema";
import { checkin } from "../use-cases/checkin";

const getAccessTokenFromAuthorizationHeader = (
  event: APIGatewayProxyEventV2
): string | undefined => {
  const rawAuthorization = event.headers.authorization ?? event.headers.Authorization;
  if (!rawAuthorization || typeof rawAuthorization !== "string") {
    return undefined;
  }

  if (!rawAuthorization.toLowerCase().startsWith("bearer ")) {
    return undefined;
  }

  const accessToken = rawAuthorization.slice(7).trim();
  return accessToken.length > 0 ? accessToken : undefined;
};

export const checkinHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedPayload = checkinSchema.safeParseEvent(event);

  if (!parsedPayload.success) {
    return createErrorResponse(event, 400, parsedPayload.error, {
      code: parsedPayload.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  const authenticatedUserId = getAuthenticatedUserId(event);
  if (!authenticatedUserId) {
    return createErrorResponse(event, 401, "Authentication required", {
      code: "AUTHENTICATION_REQUIRED"
    });
  }

  try {
    const result = await checkin({
      userId: authenticatedUserId,
      productId: parsedPayload.data.productId,
      topicId: parsedPayload.data.topicId,
      sessionId: parsedPayload.data.sessionId,
      accessToken: getAccessTokenFromAuthorizationHeader(event)
    });

    return createSuccessResponse(event, 200, result);
  } catch (error) {
    return mapAuthErrorToResponse(event, error, {
      statusCode: 500,
      message: "Failed to save checkin",
      code: "CHECKIN_SAVE_FAILED"
    });
  }
};
