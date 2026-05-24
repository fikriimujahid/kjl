import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getAuthenticatedUserId } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapAuthErrorToResponse } from "../errors/errorToResponse";
import { getCheckinActivitySchema } from "../schemas/getCheckinActivitySchema";
import { getCheckinActivity } from "../use-cases/getCheckinActivity";

export const getCheckinActivityHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedPayload = getCheckinActivitySchema.safeParseEvent(event);

  if (!parsedPayload.success) {
    return createErrorResponse(event, 400, parsedPayload.error, {
      code: "VALIDATION_ERROR"
    });
  }

  const authenticatedUserId = getAuthenticatedUserId(event);
  if (!authenticatedUserId) {
    return createErrorResponse(event, 401, "Authentication required", {
      code: "AUTHENTICATION_REQUIRED"
    });
  }

  try {
    const result = await getCheckinActivity({
      userId: authenticatedUserId,
      weekCount: parsedPayload.data.weekCount
    });

    return createSuccessResponse(event, 200, result);
  } catch (error) {
    return mapAuthErrorToResponse(event, error, {
      statusCode: 500,
      message: "Failed to fetch checkin activity",
      code: "CHECKIN_FETCH_FAILED"
    });
  }
};
