import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, HttpEventLike } from "@shared-utils/response";
import { ApplicationError } from "./applicationErrors";

export const mapErrorToResponse = (
  event: { headers?: Record<string, string | undefined>; requestContext?: { requestId?: string } },
  error: unknown
): APIGatewayProxyStructuredResultV2 | null => {
  if (!(error instanceof ApplicationError)) {
    return null;
  }

  const responseEvent: HttpEventLike = {
    headers: event.headers ?? {},
    requestContext: event.requestContext
  };

  return createErrorResponse(responseEvent, error.statusCode, error.message, { exposeMessage: true });
};