import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapLearningErrorToResponse } from "../errors/errorToResponse";
import { finishSessionAttemptSchema } from "../schemas/finishSessionAttemptSchema";
import { finishSessionAttempt } from "../use-cases/finishSessionAttempt";

export const finishSessionAttemptHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedRequest = finishSessionAttemptSchema.safeParseEvent(event);

  if (!parsedRequest.success) {
    return createErrorResponse(event, 400, parsedRequest.error, {
      code: parsedRequest.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  const authenticatedUser = getAuthenticatedUser(event);

  try {
    const response = await finishSessionAttempt({
      productId: parsedRequest.data.productId,
      topicId: parsedRequest.data.topicId,
      sessionId: parsedRequest.data.sessionId,
      attemptId: parsedRequest.data.attemptId,
      totalQuestions: parsedRequest.data.totalQuestions,
      correctAnswers: parsedRequest.data.correctAnswers,
      maxScore: parsedRequest.data.maxScore,
      obtainedScore: parsedRequest.data.obtainedScore,
      percentage: parsedRequest.data.percentage,
      passingScore: parsedRequest.data.passingScore,
      passed: parsedRequest.data.passed,
      durationSeconds: parsedRequest.data.durationSeconds,
      authenticatedUserId: authenticatedUser?.id
    });

    return createSuccessResponse(event, 200, response);
  } catch (error) {
    return mapLearningErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to finish learning session attempt",
      code: "SESSION_ATTEMPT_FINISH_FAILED"
    });
  }
};
