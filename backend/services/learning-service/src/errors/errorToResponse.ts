import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse } from "@shared-utils/response";
import {
  AuthenticationRequiredError,
  ForbiddenLearningContentAccessError,
  SessionNotFoundError,
  UnsupportedSessionTypeError
} from "./applicationErrors";

export interface LearningErrorFallback {
  statusCode: number;
  message: string;
  code: string;
}

export const mapLearningErrorToResponse = (
  event: APIGatewayProxyEventV2,
  error: unknown,
  fallback: LearningErrorFallback
): APIGatewayProxyStructuredResultV2 => {
  if (error instanceof AuthenticationRequiredError) {
    return createErrorResponse(event, 401, error.message, {
      code: "UNAUTHORIZED"
    });
  }

  if (error instanceof ForbiddenLearningContentAccessError) {
    return createErrorResponse(event, 403, error.message, {
      code: "FORBIDDEN"
    });
  }

  if (error instanceof SessionNotFoundError) {
    return createErrorResponse(event, 404, error.message, {
      code: "SESSION_NOT_FOUND"
    });
  }

  if (error instanceof UnsupportedSessionTypeError) {
    return createErrorResponse(event, 400, error.message, {
      code: "UNSUPPORTED_SESSION_TYPE"
    });
  }

  return createErrorResponse(event, fallback.statusCode, fallback.message, {
    code: fallback.code
  });
};
