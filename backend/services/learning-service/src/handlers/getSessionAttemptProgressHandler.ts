import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapLearningErrorToResponse } from "../errors/errorToResponse";
import { getSessionAttemptProgressSchema } from "../schemas/getSessionAttemptProgressSchema";
import { getSessionAttemptProgress } from "../use-cases/getSessionAttemptProgress";

export const getSessionAttemptProgressHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedRequest = getSessionAttemptProgressSchema.safeParseEvent(event);

  if (!parsedRequest.success) {
    return createErrorResponse(event, 400, parsedRequest.error, {
      code: parsedRequest.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  const authenticatedUser = getAuthenticatedUser(event);

  try {
    const response = await getSessionAttemptProgress({
      productId: parsedRequest.data.productId,
      topicId: parsedRequest.data.topicId,
      sessionId: parsedRequest.data.sessionId,
      attemptId: parsedRequest.data.attemptId,
      authenticatedUserId: authenticatedUser?.id
    });

    return createSuccessResponse(event, 200, response);
  } catch (error) {
    return mapLearningErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to get learning session attempt progress",
      code: "SESSION_ATTEMPT_PROGRESS_GET_FAILED"
    });
  }
};
