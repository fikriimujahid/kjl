import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, HttpEventLike } from "@shared-utils/response";
import { ApplicationError } from "./applicationErrors";

export interface PaymentErrorFallback {
  statusCode: number;
  message: string;
  code: string;
}

const normalizeResponseEvent = (
  event: { headers?: Record<string, string | undefined>; requestContext?: { requestId?: string } }
): HttpEventLike => ({
  headers: event.headers ?? {},
  requestContext: event.requestContext
});

export const mapErrorToResponse = (
  event: { headers?: Record<string, string | undefined>; requestContext?: { requestId?: string } },
  error: unknown
): APIGatewayProxyStructuredResultV2 | null => {
  if (!(error instanceof ApplicationError)) {
    return null;
  }

  const responseEvent = normalizeResponseEvent(event);

  return createErrorResponse(responseEvent, error.statusCode, error.message, { exposeMessage: true });
};

export const mapPaymentErrorToResponse = (
  event: { headers?: Record<string, string | undefined>; requestContext?: { requestId?: string } },
  error: unknown,
  fallback: PaymentErrorFallback
): APIGatewayProxyStructuredResultV2 => {
  const mappedErrorResponse = mapErrorToResponse(event, error);

  if (mappedErrorResponse) {
    return mappedErrorResponse;
  }

  return createErrorResponse(normalizeResponseEvent(event), fallback.statusCode, fallback.message, {
    code: fallback.code
  });
};