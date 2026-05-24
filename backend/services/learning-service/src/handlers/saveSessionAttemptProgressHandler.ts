import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapLearningErrorToResponse } from "../errors/errorToResponse";
import { saveSessionAttemptProgressSchema } from "../schemas/saveSessionAttemptProgressSchema";
import { saveSessionAttemptProgress } from "../use-cases/saveSessionAttemptProgress";

export const saveSessionAttemptProgressHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedRequest = saveSessionAttemptProgressSchema.safeParseEvent(event);

  if (!parsedRequest.success) {
    return createErrorResponse(event, 400, parsedRequest.error, {
      code: parsedRequest.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  const authenticatedUser = getAuthenticatedUser(event);

  try {
    const response = await saveSessionAttemptProgress({
      productId: parsedRequest.data.productId,
      topicId: parsedRequest.data.topicId,
      sessionId: parsedRequest.data.sessionId,
      attemptId: parsedRequest.data.attemptId,
      currentQuestionIndex: parsedRequest.data.currentQuestionIndex,
      answeredQuestionIndexes: parsedRequest.data.answeredQuestionIndexes,
      answers: parsedRequest.data.answers,
      checkedAnswers: parsedRequest.data.checkedAnswers,
      bookmarkedIndexes: parsedRequest.data.bookmarkedIndexes,
      durationSeconds: parsedRequest.data.durationSeconds,
      authenticatedUserId: authenticatedUser?.id
    });

    return createSuccessResponse(event, 200, response);
  } catch (error) {
    return mapLearningErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to save learning session attempt progress",
      code: "SESSION_ATTEMPT_PROGRESS_SAVE_FAILED"
    });
  }
};
