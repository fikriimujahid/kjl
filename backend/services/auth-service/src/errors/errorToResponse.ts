import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { CognitoOperationError } from "@shared-cognito/core";
import { createLogger } from "@shared-utils/logger";
import { createErrorResponse } from "@shared-utils/response";
import { InvalidIdTokenError } from "./applicationErrors";

const logger = createLogger("auth-service");

export interface AuthErrorFallback {
  statusCode: number;
  message: string;
  code: string;
}

const logAuthFailure = (
  event: APIGatewayProxyEventV2,
  statusCode: number,
  errorCode: string,
  error: unknown
): void => {
  logger.error("request.failed", {
    requestId: event.requestContext?.requestId,
    routeKey: event.routeKey,
    method: event.requestContext.http.method,
    statusCode,
    errorCode,
    error
  });
};

export const mapAuthErrorToResponse = (
  event: APIGatewayProxyEventV2,
  error: unknown,
  fallback: AuthErrorFallback
): APIGatewayProxyStructuredResultV2 => {
  if (error instanceof InvalidIdTokenError) {
    logAuthFailure(event, 502, "INVALID_ID_TOKEN", error);

    return createErrorResponse(event, 502, error.message, {
      code: "INVALID_ID_TOKEN"
    });
  }

  if (error instanceof CognitoOperationError) {
    logAuthFailure(event, error.statusCode, error.code, error);

    return createErrorResponse(event, error.statusCode, error.message, {
      code: error.code
    });
  }

  logAuthFailure(event, fallback.statusCode, fallback.code, error);

  return createErrorResponse(event, fallback.statusCode, fallback.message, {
    code: fallback.code
  });
};