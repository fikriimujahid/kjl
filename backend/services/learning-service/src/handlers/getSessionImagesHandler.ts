import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapLearningErrorToResponse } from "../errors/errorToResponse";
import { getSessionImagesSchema } from "../schemas/getSessionImagesSchema";
import { getSessionImages } from "../use-cases/getSessionImages";

export const getSessionImagesHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedRequest = getSessionImagesSchema.safeParseEvent(event);

  if (!parsedRequest.success) {
    return createErrorResponse(event, 400, parsedRequest.error, {
      code: parsedRequest.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  const authenticatedUser = getAuthenticatedUser(event);

  try {
    const response = await getSessionImages({
      productId: parsedRequest.data.productId,
      topicId: parsedRequest.data.topicId,
      sessionId: parsedRequest.data.sessionId,
      authenticatedUserId: authenticatedUser?.id
    });

    return createSuccessResponse(event, 200, response);
  } catch (error) {
    return mapLearningErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to get learning content",
      code: "LEARNING_CONTENT_FETCH_FAILED"
    });
  }
};
